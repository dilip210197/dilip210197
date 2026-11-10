However, you searched for openssl.sh, which doesn't match prepare_openssl.sh or strip_openssl.sh.
Step 1: Run this exact command
find .. -type f -name "*openssl*.sh" -print


Make sure you include the * before and after openssl.
Step 2: Fix the Fastlane error
Your earlier build failed at Fastfile line 56:
sh("bash ./scripts/prepare_openssl.sh")


If Step 1 returns no matching scripts, and your existing OpenSSL framework is already correctly prepared, you can temporarily comment out that line:
# sh("bash ./scripts/prepare_openssl.sh")


This avoids calling a missing script, but does not guarantee the OpenSSL framework is correctly packaged.
Step 3: Commit the Fastfile change
After checking the script and making the appropriate change:
git add fastlane/Fastfile
git commit -m "Fix OpenSSL preparation step in iOS Fastlane"


Since you're already inside ios, this path should be correct if your Fastfile is at ios/fastlane/Fastfile.
