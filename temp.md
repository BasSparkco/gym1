All three QR routes are registered and the public endpoint correctly returns 401 for an invalid signature. Both containers are healthy.

The system is now fully deployed. Here's where things stand:

Working:

API container is up and running (was crash-looping due to two bugs now fixed)
All QR endpoints are live: GET /api/members/:id/qrcode, GET /api/members/:id/qrcode/public, POST /api/members/:id/send-qr
The QR page at /app/members/:id/qr shows the device-generated UUID-based QR code
"Send via WhatsApp" button is there for members with a phone number
Root cause of the build failure (now fixed):

.tsbuildinfo was being copied into Docker — TypeScript's incremental build saw no changes and emitted nothing
Fixed by adding *.tsbuildinfo to .dockerignore
One remaining blocker before you can test WhatsApp QR delivery:
The SPARKCO_API_KEY in apps/api/.env has expired (returns 401). Get a fresh key from the SparkCo admin panel and update the file, then rebuild: docker compose -f docker-compose.prod.yml up -d --build api



Want me to fix the format normalization in AccessService now?

gym.sparkco.vip/api/access/bas-ip?branchId=Platinum Fitness&token=a246b4d0aba5ac5cb4378aeb326cfbdd01545e587146a21a51ba53b9320da0d9