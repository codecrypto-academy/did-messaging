#!/bin/bash

# Advanced DID Generator Script
# Usage: ./generate-dids-advanced.sh [options]

# Default values
COUNT=10
PREFIX="user"
DOMAIN="example.com"
OUTPUT_FILE=""
CONFIG_FILE=""
NO_SERVICES=false
NO_SOCIAL=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show help
show_help() {
    echo -e "${BLUE}🎯 Advanced DID Generator${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -c, --count <number>     Number of DIDs to generate (default: 10)"
    echo "  -p, --prefix <string>    DID prefix (default: \"user\")"
    echo "  -d, --domain <string>    Domain for services (default: \"example.com\")"
    echo "  --no-services            Don't include service endpoints"
    echo "  --no-social              Don't include social profile URLs"
    echo "  -o, --output <file>      Save results to JSON file"
    echo "  --config <file>          Load configuration from JSON file"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --count 5"
    echo "  $0 --prefix org --domain mycompany.com"
    echo "  $0 --count 20 --output results.json"
    echo "  $0 --config config-example.json"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--count)
            COUNT="$2"
            shift 2
            ;;
        -p|--prefix)
            PREFIX="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        --no-services)
            NO_SERVICES=true
            shift
            ;;
        --no-social)
            NO_SOCIAL=true
            shift
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🎯 Advanced DID Generator${NC}"
echo ""

# Check if API is running
echo -e "${YELLOW}🏥 Checking API health...${NC}"
if ! curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo -e "${RED}❌ API server is not running on http://localhost:3000${NC}"
    echo -e "${YELLOW}💡 Please start the API server first:${NC}"
    echo "   cd did-api && npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ API server is running${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "did-api-client" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Build the command
CMD="npx ts-node src/scripts/advancedDIDGenerator.ts --count $COUNT --prefix $PREFIX --domain $DOMAIN"

if [ "$NO_SERVICES" = true ]; then
    CMD="$CMD --no-services"
fi

if [ "$NO_SOCIAL" = true ]; then
    CMD="$CMD --no-social"
fi

if [ -n "$OUTPUT_FILE" ]; then
    CMD="$CMD --output $OUTPUT_FILE"
fi

if [ -n "$CONFIG_FILE" ]; then
    CMD="$CMD --config $CONFIG_FILE"
fi

# Show configuration
echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Count: $COUNT"
echo "   Prefix: $PREFIX"
echo "   Domain: $DOMAIN"
echo "   Services: $([ "$NO_SERVICES" = true ] && echo "No" || echo "Yes")"
echo "   Social Profiles: $([ "$NO_SOCIAL" = true ] && echo "No" || echo "Yes")"
if [ -n "$OUTPUT_FILE" ]; then
    echo "   Output File: $OUTPUT_FILE"
fi
if [ -n "$CONFIG_FILE" ]; then
    echo "   Config File: $CONFIG_FILE"
fi
echo ""

# Run the TypeScript script
echo -e "${YELLOW}🚀 Starting advanced DID generation...${NC}"
echo ""

cd did-api-client
eval $CMD

echo ""
echo -e "${GREEN}🎉 Script completed!${NC}"
echo ""
echo -e "${BLUE}💡 You can now:${NC}"
echo "   - View DIDs in Supabase Studio: http://localhost:54323"
echo "   - Test individual DIDs with the API client"
echo "   - Run the test suite to verify everything works"
if [ -n "$OUTPUT_FILE" ]; then
    echo "   - Check the results file: $OUTPUT_FILE"
fi
