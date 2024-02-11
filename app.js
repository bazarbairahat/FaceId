const video = document.getElementById("video");

// Функция для включения веб-камеры
function webCam() {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
    }).then(
        (stream) => {
            video.srcObject = stream;
        }
    ).catch(
        (error) => {
            console.log(error);
        }
    );
}

// Загрузка моделей face-api.js и запуск веб-камеры после их загрузки
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(webCam);

// Обработчик события, который вызывается, когда видео начинает воспроизводиться
video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

    // Периодический опрос для обнаружения лиц и вывода характеристик
    setInterval(async () => {
        const detection = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const resizedWindow = faceapi.resizeResults(detection, {
            height: video.height,
            width: video.width,
        })

        faceapi.draw.drawDetections(canvas, resizedWindow);
        faceapi.draw.drawFaceLandmarks(canvas, resizedWindow);
        faceapi.draw.drawFaceExpressions(canvas, resizedWindow);

        resizedWindow.forEach((detection) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: Math.round(detection.age) + " year old " + detection.gender,
            });
            drawBox.draw(canvas);
        });

        console.log(detection);
    }, 100);
});
