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
terraform apply -var="instances_per_zone=2" -var="suffix=squid-batch"




