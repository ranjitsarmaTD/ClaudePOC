#!/bin/bash

# API Validation Script
# Tests all API endpoints to ensure they're working correctly

set -e

API_URL="${API_URL:-http://localhost:3000/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@hradmin.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"

echo "=================================="
echo "API Validation Script"
echo "=================================="
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_test() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2"
    exit 1
  fi
}

# Check if server is running
echo "Checking if server is running..."
if curl -s "$API_URL/health" > /dev/null; then
  print_test 0 "Server is running"
else
  print_test 1 "Server is not running at $API_URL"
fi

# Test health endpoint
echo ""
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "\"success\":true"; then
  print_test 0 "Health endpoint returned success"
else
  print_test 1 "Health endpoint failed"
fi

# Test login
echo ""
echo "Testing authentication..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "\"token\""; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  print_test 0 "Login successful, token received"
else
  print_test 1 "Login failed"
fi

# Test departments endpoint
echo ""
echo "Testing departments endpoint..."
DEPT_RESPONSE=$(curl -s -X GET "$API_URL/departments" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DEPT_RESPONSE" | grep -q "\"success\":true"; then
  print_test 0 "Departments endpoint accessible"
else
  print_test 1 "Departments endpoint failed"
fi

# Test employees endpoint
echo ""
echo "Testing employees endpoint..."
EMP_RESPONSE=$(curl -s -X GET "$API_URL/employees" \
  -H "Authorization: Bearer $TOKEN")

if echo "$EMP_RESPONSE" | grep -q "\"success\":true"; then
  print_test 0 "Employees endpoint accessible"
else
  print_test 1 "Employees endpoint failed"
fi

# Test unauthorized access
echo ""
echo "Testing authentication protection..."
UNAUTH_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/departments")
if echo "$UNAUTH_RESPONSE" | grep -q "401"; then
  print_test 0 "Protected endpoints require authentication"
else
  print_test 1 "Authentication protection not working"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✓ API validation completed!${NC}"
echo "=================================="
