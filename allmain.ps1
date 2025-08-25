############################################################
# PROVIDER & PROJECT APIS
############################################################
provider "google" {
  project = "booking-p2"
}

# (Optional but nice) Ensure Compute API is enabled
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

############################################################
# VARIABLES
############################################################
variable "region_zone_map" {
  description = "Regions and their zones"
  default = {
    "asia-south1" = ["asia-south1-a", "asia-south1-b", "asia-south1-c"]
    "asia-south2" = ["asia-south2-a", "asia-south2-b", "asia-south2-c"]
  }
}

# How many instances per zone
variable "instances_distribution" {
  default = {
    "asia-south1-a" = 2
    "asia-south1-b" = 2
    "asia-south2-a" = 2
    "asia-south2-b" = 2
  }
}

# Who can reach your proxy? (PLEASE lock this down)
variable "allowed_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to access 3128 (and optional SSH)"
  default     = ["0.0.0.0/0"]
}

# Allow SSH? If true, opens tcp/22 from allowed_cidrs
variable "allow_ssh" {
  type    = bool
  default = true
}

variable "suffix" {
  type    = string
  default = null
}

variable "machine_type" {
  type    = string
  default = "e2-small"
}

variable "image_family" {
  default = "centos-stream-9"
}

variable "image_project" {
  default = "centos-cloud"
}

############################################################
# LOCALS
############################################################
locals {
  # e.g., 20250825-153210
  batch_suffix = var.suffix != null ? var.suffix : formatdate("YYYYMMDD-HHmmss", timestamp())

  regions = keys(var.region_zone_map)

  # Simple per-region CIDRs (adjust if you need larger ranges)
  region_cidrs = {
    for r in local.regions :
    r => (
      r == "asia-south1" ? "10.10.0.0/20" :
      r == "asia-south2" ? "10.20.0.0/20" :
      "10.99.0.0/20"
    )
  }

  # Flattened instance plan across zones
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

############################################################
# NETWORK: VPC & SUBNETS
############################################################
resource "google_compute_network" "p2_vpc" {
  name                    = "p2-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.compute]
}

resource "google_compute_subnetwork" "p2_subnets" {
  for_each      = toset(local.regions)
  name          = "p2-${each.key}"
  ip_cidr_range = local.region_cidrs[each.key]
  region        = each.key
  network       = google_compute_network.p2_vpc.id
}

############################################################
# FIREWALLS
############################################################
# Allow Squid (3128) to VMs tagged 'squid-proxy'
resource "google_compute_firewall" "allow_squid_3128" {
  name    = "p2-allow-squid-3128"
  network = google_compute_network.p2_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["3128"]
  }

  # Accept from anywhere
  source_ranges = ["0.0.0.0/0"]

  target_tags = ["squid-proxy"]
}

# (Optional) Allow SSH to same tagged VMs
resource "google_compute_firewall" "allow_ssh" {
  count   = var.allow_ssh ? 1 : 0
  name    = "p2-allow-ssh"
  network = google_compute_network.p2_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.allowed_cidrs
  target_tags   = ["squid-proxy"]
}

############################################################
# STATIC EXTERNAL IPS (regional)
############################################################
resource "google_compute_address" "static_ip" {
  count  = length(local.instance_configs)
  name   = "p2-ip-${local.batch_suffix}-${count.index}"
  region = local.instance_configs[count.index].region
  depends_on = [
    google_compute_network.p2_vpc,
    google_compute_subnetwork.p2_subnets
  ]
}

############################################################
# STARTUP SCRIPT (installs squid + opens port in firewalld)
############################################################
locals {
  startup_script = <<-EOF
    #!/bin/bash
    set -euxo pipefail

    # Update and install Squid
    dnf -y update || true
    dnf -y install squid

    # Configure Squid (restrict to your allowed_cidrs if you like)
    # Replace the src ACL below with your real IP/CIDR for safer usage.
    cat <<'EOC' > /etc/squid/squid.conf
    http_port 0.0.0.0:3128

    # Example: lock to a CIDR (edit as needed)
    acl allowed_src src 0.0.0.0/0

    # Block SMTP via proxy
    acl smtp port 25
    http_access deny smtp

    # Allow your src, then deny everything else
    http_access allow allowed_src
    http_access deny all

    forwarded_for delete
    request_header_access Via deny all
    request_header_access X-Forwarded-For deny all
    EOC

    # Open OS firewall if running
    if systemctl is-active --quiet firewalld; then
      firewall-cmd --permanent --add-port=3128/tcp || true
      firewall-cmd --reload || true
    fi

    systemctl enable --now squid
  EOF
}

############################################################
# INSTANCES
############################################################
resource "google_compute_instance" "squid_proxy" {
  count        = length(local.instance_configs)
  name         = "p2-vm2-${local.batch_suffix}-${count.index}"
  machine_type = var.machine_type
  zone         = local.instance_configs[count.index].zone
  tags         = ["squid-proxy"]

  boot_disk {
    initialize_params {
      image_family  = var.image_family
      image_project = var.image_project
    }
  }

  # Attach to our custom VPC + the correct regional subnet
  network_interface {
    subnetwork = google_compute_subnetwork.p2_subnets[local.instance_configs[count.index].region].self_link

    # Static external IP
    access_config {
      nat_ip = google_compute_address.static_ip[count.index].address
    }
  }

  metadata_startup_script = local.startup_script

  # (Optional) minimal service account if you don't need GCP APIs
  service_account {
    scopes = ["https://www.googleapis.com/auth/logging.write", "https://www.googleapis.com/auth/monitoring.write"]
  }

  depends_on = [
    google_compute_firewall.allow_squid_3128,
    google_project_service.compute
  ]
}

############################################################
# OUTPUTS
############################################################
output "external_ips" {
  value = [for ip in google_compute_address.static_ip : ip.address]
}

output "instance_names" {
  value = [for vm in google_compute_instance.squid_proxy : vm.name]
}

output "subnets" {
  value = {
    for k, v in google_compute_subnetwork.p2_subnets :
    k => v.ip_cidr_range
  }
}
