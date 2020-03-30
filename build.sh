#! /bin/bash


echo "Killing any old processes"
killall game-linux > /dev/null 2>&1
killall game-darwin > /dev/null 2>&1

echo "Purging old binaries"
rm dist/*

echo "Building new binaries"
cd src
GOOS=darwin GOARCH=amd64 go build -o ../dist/game-osx
GOOS=linux GOARCH=amd64 go build -o ../dist/game-linux
cd ..

echo "Starting new built binary"
if [[ "$OSTYPE" == "linux-gnu" ]]; then
    dist/game-linux &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    dist/game-darwin &
else
    echo "i have no idea what's going on"
fi
