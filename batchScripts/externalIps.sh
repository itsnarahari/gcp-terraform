#!/bin/bash

# List of IPs to check
ips=(
    35.244.37.107
    34.93.164.36
    35.244.62.73
    35.200.216.107
    34.131.175.254
    34.131.216.43
    34.131.101.112
    34.131.237.95
    34.93.14.98
    34.100.199.60
    34.100.130.110
    35.244.19.126
    34.131.176.255
    34.131.2.110
    34.131.126.86
    34.131.92.41
)

# Function to test proxy with curl
test_proxy() {
  ip=$1
  echo "🔄 Testing proxy $ip:3128"
  for i in {1..3}; do
    echo "Attempt $i..."
    curl -s --proxy http://$ip:3128 http://example.com --max-time 5 > /dev/null
    if [ $? -eq 0 ]; then
      echo "✅ Proxy $ip:3128 is working!"
      return
    fi
    sleep 1
  done
  echo "❌ Proxy $ip:3128 failed after 3 attempts"
}

# Loop through each IP
for ip in "${ips[@]}"; do
  test_proxy $ip
done

# 🔒 Keep window open
echo ""
read -p "Press ENTER to close..."
