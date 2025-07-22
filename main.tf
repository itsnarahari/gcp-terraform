provider "google" {
  project = "shaped-orbit-466705-v7"
  region  = "asia-south1"
  zone    = "asia-south1-a"
}


resource "google_compute_instance" "squid_proxy" {
  name         = "squid-vm"
  machine_type = "e2-small"
  zone         = "asia-south1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      labels = {
        my_label = "value"
      }
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  tags = ["squid-proxy"]

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt update
    apt install -y squid

    sed -i '/http_access deny all/d' /etc/squid/squid.conf
    if ! grep -q "^http_access allow all" /etc/squid/squid.conf; then
      echo "http_access allow all" >> /etc/squid/squid.conf
    fi

    sed -i '/^#http_port 3128/s/^#//' /etc/squid/squid.conf
    if ! grep -q "^http_port 3128" /etc/squid/squid.conf; then
      echo "http_port 3128" >> /etc/squid/squid.conf
    fi

    systemctl restart squid
    systemctl enable squid
  EOF
}

resource "google_compute_firewall" "allow_squid_port" {
  name    = "allow-squid-3128"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["3128"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["squid-proxy"]
}

output "external_ip" {
  description = "External IP of the Squid VM"
  value       = google_compute_instance.squid_proxy.network_interface[0].access_config[0].nat_ip
}
