#!/bin/bash
set -euo pipefail

IOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SOURCE="$IOS_DIR/Pods/OpenSSL-Universal/OpenSSL.xcframework"
OUTPUT="$IOS_DIR/build/StrippedOpenSSL.xcframework"

if [ ! -d "$SOURCE" ]; then
  echo "ERROR: OpenSSL framework not found"
  exit 1
fi

mkdir -p "$IOS_DIR/build"
rm -rf "$OUTPUT"
ditto "$SOURCE" "$OUTPUT"

echo "Checking OpenSSL framework..."

find "$OUTPUT" -type f -name OpenSSL | while IFS= read -r binary; do
  if file "$binary" | grep -q 'Mach-O'; then
    echo "Processing: $binary"

    # Remove bitcode when the installed Xcode supports this operation.
    if xcrun --find bitcode_strip >/dev/null 2>&1; then
      xcrun bitcode_strip "$binary" -r -o "$binary"
    else
      echo "bitcode_strip unavailable; checking existing binary"
    fi

    if xcrun otool -l "$binary" | grep -q '__LLVM'; then
      echo "ERROR: __LLVM segment remains: $binary"
      exit 1
    fi
  fi
done

echo "OpenSSL preparation complete"
