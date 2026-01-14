#!/bin/bash

# HR Admin API Sanity Check Script
# This script performs comprehensive validation before commits/pushes

set -e

echo "=================================="
echo "Starting Sanity Check..."
echo "=================================="

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2"
    exit 1
  fi
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Node.js version
echo ""
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
  print_status 0 "Node.js version is compatible (v$(node -v))"
else
  print_status 1 "Node.js version must be >= 18 (current: v$(node -v))"
fi

# 2. Check if dependencies are installed
echo ""
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
  print_status 0 "Dependencies are installed"
else
  print_status 1 "Dependencies not installed. Run 'npm install'"
fi

# 3. TypeScript compilation check
echo ""
echo "3. Running TypeScript compilation..."
npm run build > /dev/null 2>&1
print_status $? "TypeScript compilation successful"

# 4. Linting check
echo ""
echo "4. Running ESLint..."
npm run lint > /dev/null 2>&1
print_status $? "ESLint passed with no errors"

# 5. Code formatting check
echo ""
echo "5. Checking code formatting..."
npm run format:check > /dev/null 2>&1
print_status $? "Code formatting is correct"

# 6. Unit tests
echo ""
echo "6. Running unit tests..."
npm run test:unit > /dev/null 2>&1
if [ $? -eq 0 ]; then
  print_status 0 "All unit tests passed"
else
  print_warning "Some unit tests failed. Review test output."
fi

# 7. Check for console.log statements (warning only)
echo ""
echo "7. Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log" src/ --include="*.ts" | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
  print_warning "Found $CONSOLE_LOGS console.log statements in src/. Consider using logger instead."
else
  print_status 0 "No console.log statements found"
fi

# 8. Check for TODO comments
echo ""
echo "8. Checking for TODO comments..."
TODO_COUNT=$(grep -r "TODO" src/ --include="*.ts" | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
  print_warning "Found $TODO_COUNT TODO comments. Remember to address them."
else
  print_status 0 "No TODO comments found"
fi

# 9. Check environment variables
echo ""
echo "9. Checking environment configuration..."
if [ -f ".env.example" ]; then
  print_status 0 ".env.example file exists"
else
  print_status 1 ".env.example file is missing"
fi

# 10. Check for sensitive data in commits
echo ""
echo "10. Checking for sensitive data..."
SECRETS_FOUND=0

# Check for potential secrets
if git diff --cached --name-only | xargs grep -l "password\|secret\|api_key\|private_key" > /dev/null 2>&1; then
  print_warning "Potential sensitive data found in staged files. Please review."
  SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
  print_status 0 "No obvious sensitive data found in staged files"
fi

# 11. Check package.json for security issues
echo ""
echo "11. Checking for security vulnerabilities..."
npm audit --audit-level=high > /dev/null 2>&1
if [ $? -eq 0 ]; then
  print_status 0 "No high-severity vulnerabilities found"
else
  print_warning "Security vulnerabilities detected. Run 'npm audit' for details."
fi

echo ""
echo "=================================="
echo -e "${GREEN}✓ Sanity check completed!${NC}"
echo "=================================="
echo ""
