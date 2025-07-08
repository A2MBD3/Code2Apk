# Android Build Environment
FROM ubuntu:22.04

# Set environment variables
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=$ANDROID_SDK_ROOT
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
ENV PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
ENV PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/33.0.2
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    openjdk-11-jdk \
    git \
    && rm -rf /var/lib/apt/lists/*

# Download and install Android SDK
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip -O android-sdk.zip && \
    unzip android-sdk.zip -d $ANDROID_SDK_ROOT/cmdline-tools && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    rm android-sdk.zip

# Accept SDK licenses and install required packages
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"

# Set working directory
WORKDIR /workspace

# Copy build script
COPY build-android.sh /usr/local/bin/build-android.sh
RUN chmod +x /usr/local/bin/build-android.sh

CMD ["/bin/bash"]