############################################
# Provider
############################################
provider "google" {
  project = "booking-p2"
}

############################################
# Vars (minimal)
############################################
variable "instances_distribution" {
  default = {
    "asia-south1-a" = 2
    "asia-south1-b" = 2
    "asia-south2-a" = 2
    "asia-south2-b" = 2
  }
}

variable "suffix" {
  type    = string
  default = null
}

# WARNING: open proxy. Keep as 0.0.0.0/0 only if you really intend it.
variable "allowed_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

############################################
# Locals
############################################
locals {
  batch_suffix = var.suffix != null ? var.suffix : formatdate("YYYYMMDD-HHmmss", timestamp())

  instance_configs = flatten([
    for zone, count in var.instances_distribution : [
      for i in range(count) : {
        zone   = zone
        region = format("%s-%s", split("-", zone)[0], split("-", zone)[1])
        index  = "${zone}-${i}"
      }
    ]
  ])
}

############################################
# Static external IPs (regional)
############################################
resource "google_compute_address" "static_ip" {
  count  = length(local.instance_configs)
  name   = "p2-ip-${local.batch_suffix}-${count.index}"
  region = local.instance_configs[count.index].region
}

############################################
# GCP firewall (default network) — open 3128
############################################
resource "google_compute_firewall" "allow_squid_3128" {
  name    = "allow-squid-3128"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["3128"]
  }

  source_ranges = var.allowed_cidrs
  target_tags   = ["squid-proxy"]
}

# (Optional) SSH if you want it
resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh-squid"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.allowed_cidrs
  target_tags   = ["squid-proxy"]
}

############################################
# Instances (CentOS Stream 9)
############################################
resource "google_compute_instance" "squid_proxy" {
  count        = length(local.instance_configs)
  name         = "p2-vm2-${local.batch_suffix}-${count.index}"
  machine_type = "e2-small"
  zone         = local.instance_configs[count.index].zone
  tags         = ["squid-proxy"]

  boot_disk {
    initialize_params {
      # Family URL (recommended)
      image = "projects/centos-cloud/global/images/family/centos-stream-9"
      # Shorthand also works: "centos-cloud/centos-stream-9"
    }
  }

  # Using DEFAULT network per your original config
  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.static_ip[count.index].address
    }
  }

  # Startup script: install squid, allow all, open firewalld
  metadata_startup_script = <<-EOF
    #!/bin/bash
    set -euxo pipefail

    # Update and install squid + firewalld (just in case)
    dnf -y update || true
    dnf -y install squid firewalld || true

    # Squid config — OPEN PROXY (be aware of abuse risk)
    cat >/etc/squid/squid.conf <<'EOC'
    http_port 0.0.0.0:3128

    # OPEN ACCESS
    http_access allow all

    # Optional: block SMTP port through proxy (good hygiene)
    acl smtp port 25
    http_access deny smtp

    forwarded_for delete
    request_header_access Via deny all
    request_header_access X-Forwarded-For deny all
    EOC

    # Ensure firewalld is running and open 3128/tcp
    systemctl enable --now firewalld || true
    firewall-cmd --permanent --add-port=3128/tcp || true
    firewall-cmd --reload || true

    # Enable and start squid
    systemctl enable --now squid

    # Show status for debugging
    systemctl status squid --no-pager || true
    ss -lntp | grep 3128 || true
  EOF

  # Minimal scopes are fine
  service_account {
    scopes = ["https://www.googleapis.com/auth/logging.write", "https://www.googleapis.com/auth/monitoring.write"]
  }

  # Ensure firewall rule exists before VM boots (so tags match)
  depends_on = [google_compute_firewall.allow_squid_3128]
}

############################################
# Outputs
############################################
output "external_ips" {
  value = [for ip in google_compute_address.static_ip : ip.address]
}

output "instance_names" {
  value = [for vm in google_compute_instance.squid_proxy : vm.name]
}
