$image = "docker.starkeydigital.com/spin-wheel-game:latest";
docker build . -t $image --platform linux/amd64;
docker push $image;