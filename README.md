Clone this repo by: git clone https://github.com/itsnarahari/gcp-terraform.git
gcloud install:
    https://cloud.google.com/sdk/docs/install
Terraform install:
    https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli

Set the project name
    gcloud config set project shaped-orbit-466705-v7
Authenticate
    gcloud auth application-default login
    gcloud auth login

terraform init
terraform apply -var="instances_per_zone=2" -var="suffix=c"

proxy:$apr1$J4ZR1Qh6$A8DGQWNCY4N9GHqM6CCid.
 
auth_param basic program /usr/lib64/squid/basic_ncsa_auth /etc/squid/passwd
auth_param basic realm proxy
acl authenticated proxy_auth REQUIRED
acl smtp port 25
http_access allow authenticated
http_port 0.0.0.0:3128
http_access deny smtp
http_access deny all
forwarded_for delete


acl smtp port 25
http_port 0.0.0.0:3128
http_access deny smtp
http_access allow all
forwarded_for delete

sudo dnf install -y squid
sudo bash -c 'cat > /etc/squid/squid.conf' <<EOF
http_port 0.0.0.0:3129
acl smtp port 25
http_access deny smtp
http_access allow all
forwarded_for delete
EOF
sudo systemctl enable --now squid


https://itsnarahari.github.io/gcp-terraform/stockYard.js

gcloud auth login
gcloud config set project booking-p2
gcloud auth application-default login


terraform init
terraform plan
terraform apply




