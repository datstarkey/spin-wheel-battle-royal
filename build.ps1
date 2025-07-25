$image = "docker.starkeydigital.com/spin-wheel-game:latest";

# Check if current context is talos
$currentContext = kubectl config current-context
if ($currentContext -ne "talos") {
    Write-Host "Error: Current Kubernetes context is '$currentContext', not 'talos'" -ForegroundColor Red
    Write-Host "Please switch to talos context using: kubectl config use-context talos" -ForegroundColor Yellow
    exit 1
}

Write-Host "Building Docker image for linux/amd64..." -ForegroundColor Green
docker build . -t $image --platform linux/amd64;

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing Docker image..." -ForegroundColor Green
docker push $image;

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Restarting pod in Kubernetes..." -ForegroundColor Green
# Get the pod name that starts with spin-game
$podName = kubectl get pods -n websites --no-headers -o custom-columns=":metadata.name" | Where-Object { $_ -like "spin-game*" }

if ($podName) {
    Write-Host "Found pod: $podName" -ForegroundColor Cyan
    kubectl delete pod $podName -n websites
    Write-Host "Pod restart initiated successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: No pod found starting with 'spin-game' in namespace 'websites'" -ForegroundColor Yellow
}