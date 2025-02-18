#!/bin/bash

cd eis-tracker

NODE_ENV="production"

npm install

npm run build

echo "Next.js build successful"