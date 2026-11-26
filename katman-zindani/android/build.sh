#!/bin/bash
# Katman Zindanı APK derleyici (Gradle'sız, doğrudan Android build-tools)
set -e
cd "$(dirname "$0")"
SDK=${ANDROID_HOME:-/opt/android-sdk}; BT=$SDK/build-tools/34.0.0; JAR=$SDK/platforms/android-34/android.jar
rm -rf build && mkdir -p build/res build/gen build/classes build/apk/assets
cp -r ../www build/apk/assets/www
$BT/aapt2 compile --dir res -o build/res/res.zip
$BT/aapt2 link -o build/base.apk -I $JAR --manifest AndroidManifest.xml -A build/apk/assets --java build/gen build/res/res.zip --min-sdk-version 21 --target-sdk-version 34
javac -source 8 -target 8 -nowarn -bootclasspath $JAR -classpath $JAR -d build/classes build/gen/com/katman/zindani/R.java src/com/katman/zindani/MainActivity.java 2>&1 | grep -v "bootstrap\|obsolete\|warning" || true
$BT/d8 --min-api 21 --output build/ --lib $JAR $(find build/classes -name '*.class')
cd build && cp base.apk unsigned.apk && zip -q -j unsigned.apk classes.dex && cd ..
$BT/zipalign -f -p 4 build/unsigned.apk build/aligned.apk
[ -f katman.keystore ] || keytool -genkeypair -keystore katman.keystore -storepass katman123 -keypass katman123 -alias katman -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Katman Zindani" >/dev/null 2>&1
$BT/apksigner sign --ks katman.keystore --ks-pass pass:katman123 --key-pass pass:katman123 --out ../KatmanZindani.apk build/aligned.apk
$BT/apksigner verify ../KatmanZindani.apk && ls -la ../KatmanZindani.apk
