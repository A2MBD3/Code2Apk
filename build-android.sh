#!/bin/bash

# Android APK Build Script
set -e

PROJECT_PATH=$1
OUTPUT_PATH=$2
BUILD_TYPE=${3:-debug}

if [ -z "$PROJECT_PATH" ] || [ -z "$OUTPUT_PATH" ]; then
    echo "Usage: build-android.sh <project_path> <output_path> [build_type]"
    exit 1
fi

echo "[INFO] Starting Android build process..."
echo "[INFO] Project path: $PROJECT_PATH"
echo "[INFO] Output path: $OUTPUT_PATH"
echo "[INFO] Build type: $BUILD_TYPE"

# Navigate to project directory
cd "$PROJECT_PATH"

# Check if this is a valid Android project
if [ ! -f "build.gradle" ] && [ ! -f "app/build.gradle" ]; then
    echo "[ERROR] No build.gradle found. This doesn't appear to be an Android project."
    exit 1
fi

# Check for AndroidManifest.xml
if [ ! -f "app/src/main/AndroidManifest.xml" ] && [ ! -f "src/main/AndroidManifest.xml" ]; then
    echo "[ERROR] AndroidManifest.xml not found. Invalid Android project structure."
    exit 1
fi

echo "[INFO] Validating project structure... ✓"

# Make gradlew executable if it exists
if [ -f "gradlew" ]; then
    chmod +x gradlew
    GRADLE_CMD="./gradlew"
else
    # Use system gradle if gradlew doesn't exist
    GRADLE_CMD="gradle"
fi

echo "[INFO] Cleaning previous builds..."
$GRADLE_CMD clean

echo "[INFO] Building APK..."
if [ "$BUILD_TYPE" = "release" ]; then
    $GRADLE_CMD assembleRelease
    APK_PATH=$(find . -name "*-release.apk" | head -n 1)
else
    $GRADLE_CMD assembleDebug
    APK_PATH=$(find . -name "*-debug.apk" | head -n 1)
fi

if [ -z "$APK_PATH" ]; then
    echo "[ERROR] APK build failed - no APK file found"
    exit 1
fi

echo "[INFO] APK built successfully: $APK_PATH"

# Copy APK to output location
mkdir -p "$(dirname "$OUTPUT_PATH")"
cp "$APK_PATH" "$OUTPUT_PATH"

echo "[INFO] APK copied to: $OUTPUT_PATH"
echo "[INFO] Build completed successfully! ✓"

# Get APK info
APK_SIZE=$(stat -c%s "$OUTPUT_PATH")
echo "[INFO] APK size: $APK_SIZE bytes"