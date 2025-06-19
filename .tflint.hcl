# See: https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/plugins.md
##
# Enable the TF rules
plugin "terraform" {
    enabled = true
    # See: https://github.com/terraform-linters/tflint-ruleset-terraform/releases
    version = "0.12.0"
    source  = "github.com/terraform-linters/tflint-ruleset-terraform"
}
