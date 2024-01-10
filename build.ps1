$image = "docker.starkeydigital.com/spin-wheel-game:latest";
docker build . -t $image;
docker push $image;