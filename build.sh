#!/bin/bash

cd eis-tracker

NODE_ENV="production"

if npm run build; then
  echo "Build successful"
else
  echo "Build Failed"
  exit 1
fi