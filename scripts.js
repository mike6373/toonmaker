document.addEventListener("DOMContentLoaded", () => {
    let currentSlideIndex = 0;
    let slideCount = 1;
    let selectedElement = null;
    const slides = document.querySelectorAll(".slide");
    const totalSlides = () => document.querySelectorAll(".slide").length;
    const textMenu = document.getElementById("textMenu");
    const imageMenu = document.getElementById("imageMenu");
    const audioMenu = document.getElementById("audioMenu");
    const slideNumberElement = document.getElementById("slideNumber");
    let mediaRecorder;
    let audioChunks = [];

    const showSlide = (index) => {
        document.querySelectorAll(".slide").forEach((slide, i) => {
            slide.classList.toggle("active", i === index);
        });
        updateSlideNumber();
    };

    const updateSlideNumber = () => {
        slideNumberElement.textContent = `Slide ${currentSlideIndex + 1} of ${totalSlides()}`;
    };

    const makeDraggable = (element) => {
        let offsetX, offsetY;

        element.addEventListener("mousedown", (e) => {
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            document.addEventListener("mousemove", moveElement);
            document.addEventListener("mouseup", stopMoveElement);
        });

        const moveElement = (e) => {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        };

        const stopMoveElement = () => {
            document.removeEventListener("mousemove", moveElement);
            document.removeEventListener("mouseup", stopMoveElement);
        };
    };

    const addSlide = () => {
        const newSlide = document.createElement("div");
        newSlide.classList.add("slide");
        newSlide.id = `slide${slideCount + 1}`;
        document.getElementById("presentation").appendChild(newSlide);
        slideCount++;
        currentSlideIndex = totalSlides() - 1;
        showSlide(currentSlideIndex);
    };

    const duplicateSlide = () => {
        const currentSlide = document.querySelectorAll(".slide")[currentSlideIndex];
        const newSlide = currentSlide.cloneNode(true);
        newSlide.id = `slide${slideCount + 1}`;
        document.getElementById("presentation").appendChild(newSlide);
        slideCount++;
        currentSlideIndex = totalSlides() - 1;
        showSlide(currentSlideIndex);
        newSlide.querySelectorAll(".draggable").forEach(makeDraggable); // Make all elements draggable in duplicated slide
    };

    const selectElement = (element) => {
        if (selectedElement) {
            selectedElement.classList.remove("selected");
        }
        selectedElement = element;
        selectedElement.classList.add("selected");

        if (selectedElement.tagName === "DIV" && selectedElement.classList.contains("draggable")) {
            if (selectedElement.firstChild && selectedElement.firstChild.tagName === "IMG") {
                imageMenu.style.display = "block";
                textMenu.style.display = "none";
                audioMenu.style.display = "none";
                document.getElementById("imageSizeInput").value = selectedElement.firstChild.width;
            } else if (selectedElement.contentEditable === "true") {
                textMenu.style.display = "block";
                imageMenu.style.display = "none";
                audioMenu.style.display = "none";
                document.getElementById("textSizeInput").value = parseInt(window.getComputedStyle(selectedElement).fontSize);
                document.getElementById("textColor").value = rgbToHex(window.getComputedStyle(selectedElement).color);
            }
        } else if (selectedElement.tagName === "DIV" && selectedElement.firstChild.tagName === "AUDIO") {
            audioMenu.style.display = "block";
            textMenu.style.display = "none";
            imageMenu.style.display = "none";
        }
    };

    const rgbToHex = (rgb) => {
        const rgbValues = rgb.match(/\d+/g).map(Number);
        return `#${((1 << 24) + (rgbValues[0] << 16) + (rgbValues[1] << 8) + rgbValues[2]).toString(16).slice(1).toUpperCase()}`;
    };

    document.getElementById("prevBtn").addEventListener("click", () => {
        currentSlideIndex = (currentSlideIndex > 0) ? currentSlideIndex - 1 : totalSlides() - 1;
        showSlide(currentSlideIndex);
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        currentSlideIndex = (currentSlideIndex < totalSlides() - 1) ? currentSlideIndex + 1 : 0;
        showSlide(currentSlideIndex);
    });

    document.getElementById("addSlideBtn").addEventListener("click", addSlide);
    document.getElementById("duplicateSlideBtn").addEventListener("click", duplicateSlide);

    showSlide(currentSlideIndex);

    document.getElementById("addTextBtn").addEventListener("click", () => {
        const textElement = document.createElement("div");
        textElement.classList.add("draggable");
        textElement.contentEditable = true;
        textElement.style.left = "50px";
        textElement.style.top = "50px";
        textElement.textContent = "New Text";
        document.querySelectorAll(".slide")[currentSlideIndex].appendChild(textElement);
        makeDraggable(textElement);
        selectElement(textElement);
    });

    document.getElementById("addImageBtn").addEventListener("click", () => {
        document.getElementById("imageInput").click();
    });

    document.getElementById("imageInput").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgElement = document.createElement("img");
                imgElement.src = e.target.result;
                const container = document.createElement("div");
                container.classList.add("draggable");
                container.style.left = "50px";
                container.style.top = "50px";
                container.appendChild(imgElement);
                document.querySelectorAll(".slide")[currentSlideIndex].appendChild(container);
                makeDraggable(container);
                selectElement(container);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("addAudioBtn").addEventListener("click", () => {
        document.getElementById("audioInput").click();
    });

    document.getElementById("audioInput").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const audioElement = document.createElement("audio");
                audioElement.src = e.target.result;
                audioElement.controls = true;
                const container = document.createElement("div");
                container.classList.add("draggable");
                container.style.left = "50px";
                container.style.top = "50px";
                container.appendChild(audioElement);
                document.querySelectorAll(".slide")[currentSlideIndex].appendChild(container);
                makeDraggable(container);
                selectElement(container);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("recordAudioBtn").addEventListener("click", async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Audio recording is not supported in this browser.");
            return;
        }

        audioChunks = [];

        try {
            const stream = await navigator.mediaDevices.getUser
Media({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.addEventListener("dataavailable", (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            });

            mediaRecorder.addEventListener("stop", () => {
                const blob = new Blob(audioChunks, { type: "audio/wav" });
                const audioURL = URL.createObjectURL(blob);
                const audioElement = document.createElement("audio");
                audioElement.src = audioURL;
                audioElement.controls = true;
                const container = document.createElement("div");
                container.classList.add("draggable");
                container.style.left = "50px";
                container.style.top = "50px";
                container.appendChild(audioElement);
                document.querySelectorAll(".slide")[currentSlideIndex].appendChild(container);
                makeDraggable(container);
                selectElement(container);
            });

            mediaRecorder.start();
            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Error accessing microphone. Please check your browser settings and try again.");
        }
    });

    document.getElementById("textSizeInput").addEventListener("input", () => {
        if (selectedElement && selectedElement.contentEditable === "true") {
            selectedElement.style.fontSize = `${document.getElementById("textSizeInput").value}px`;
        }
    });

    document.getElementById("textColor").addEventListener("input", () => {
        if (selectedElement && selectedElement.contentEditable === "true") {
            selectedElement.style.color = document.getElementById("textColor").value;
        }
    });

    document.getElementById("imageSizeInput").addEventListener("input", () => {
        if (selectedElement && selectedElement.firstChild && selectedElement.firstChild.tagName === "IMG") {
            selectedElement.firstChild.style.width = `${document.getElementById("imageSizeInput").value}px`;
        }
    });

    document.getElementById("mirrorImageBtn").addEventListener("click", () => {
        if (selectedElement && selectedElement.firstChild && selectedElement.firstChild.tagName === "IMG") {
            const img = selectedElement.firstChild;
            img.style.transform = img.style.transform === "scaleX(-1)" ? "scaleX(1)" : "scaleX(-1)";
        }
    });

    const presentation = document.getElementById("presentation");

    presentation.addEventListener("click", (e) => {
        if (e.target.classList.contains("draggable") || e.target.parentElement.classList.contains("draggable")) {
            selectElement(e.target.classList.contains("draggable") ? e.target : e.target.parentElement);
        } else if (e.target.tagName === "DIV" && e.target.classList.contains("slide")) {
            if (selectedElement) {
                selectedElement.classList.remove("selected");
                selectedElement = null;
                textMenu.style.display = "none";
                imageMenu.style.display = "none";
                audioMenu.style.display = "none";
            }
        }
    });

    // Hide menus initially
    textMenu.style.display = "none";
    imageMenu.style.display = "none";
    audioMenu.style.display = "none";

    // Make initial elements draggable
    document.querySelectorAll(".draggable").forEach(makeDraggable);

    // Show the first slide initially
    showSlide(currentSlideIndex);
});
