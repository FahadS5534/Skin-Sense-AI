import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Canonical landmark indices for facial regions from MediaPipe FaceMesh
export const REGION_LANDMARK_INDICES = {
  // Forehead: upper border along hairline, temples, and supraorbital ridge
  forehead: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  
  // Eyebrows
  right_eyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  left_eyebrow: [336, 296, 334, 293, 300, 276, 283, 282, 295, 285],
  
  // Eyes (Exclusion & contour)
  // Subject right eye (Viewer left)
  right_eye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  // Subject left eye (Viewer right)
  left_eye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  
  // Under-eye (Infraorbital skin strictly below lower eyelids)
  right_undereye: [130, 25, 110, 24, 23, 22, 26, 112, 243, 116, 123, 147],
  left_undereye: [359, 255, 339, 254, 253, 252, 256, 341, 463, 345, 352, 376],
  
  // Nose: Bridge to nasal tip and alar base
  nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 98, 97, 327, 326, 278, 48, 218, 438],
  
  // Cheeks: Malar prominence & zygomatic arch
  right_cheek: [116, 123, 147, 213, 192, 214, 210, 211, 32, 208, 199, 138, 135, 136, 150, 149, 176, 148],
  left_cheek: [345, 352, 376, 433, 416, 434, 430, 431, 262, 428, 421, 367, 364, 365, 379, 378, 400, 377],
  
  // Lips (Exclusion & boundary)
  lips: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  
  // Chin: Mentum & lower mandibular curve
  chin: [175, 199, 200, 201, 152, 377, 400, 378, 379, 365, 397, 288, 176, 148, 152]
};

// Singleton FaceLandmarker instance
let faceLandmarkerInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initializes MediaPipe FaceLandmarker with local offline assets and CDN fallback.
 */
export async function getFaceLandmarker() {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }
  if (isInitializing && initPromise) {
    return await initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // 1. Initialize FilesetResolver using local public wasm or CDN
      let filesetResolver;
      try {
        filesetResolver = await FilesetResolver.forVisionTasks("/wasm");
      } catch (err) {
        console.warn("Local WASM load failed, trying CDN fallback...", err);
        filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
      }

      // 2. Initialize FaceLandmarker using local task model or Google CDN
      try {
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "IMAGE",
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });
      } catch (gpuErr) {
        console.warn("GPU delegate unavailable, falling back to CPU delegate...", gpuErr);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "IMAGE",
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      }

      return faceLandmarkerInstance;
    } catch (finalErr) {
      console.error("Failed to initialize MediaPipe FaceLandmarker:", finalErr);
      throw finalErr;
    } finally {
      isInitializing = false;
    }
  })();

  return await initPromise;
}

/**
 * Detects real facial landmarks on an image file or element.
 * Returns { hasFace, landmarks, regions, connections, error }
 */
export async function detectLandmarksFromImage(imageSource) {
  try {
    const landmarker = await getFaceLandmarker();
    let imgElement = imageSource;

    // If a File or Blob is provided, create an Image element
    if (imageSource instanceof File || imageSource instanceof Blob) {
      imgElement = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error("Failed to load image file into element."));
        img.src = URL.createObjectURL(imageSource);
      });
    }

    const results = landmarker.detect(imgElement);

    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        hasFace: false,
        landmarks: null,
        regions: null,
        meshConnections: null,
        error: "Face not detected — please upload a clearer, front-facing image."
      };
    }

    // Extract first detected face (478 normalized landmarks: {x, y, z})
    const rawLandmarks = results.faceLandmarks[0];

    // Build anatomical regional polygons from landmarks
    const regions = {
      forehead: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.forehead),
      right_cheek: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.right_cheek),
      left_cheek: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.left_cheek),
      nose: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.nose),
      chin: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.chin),
      right_undereye: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.right_undereye),
      left_undereye: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.left_undereye),
      right_eye: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.right_eye),
      left_eye: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.left_eye),
      lips: extractPolygonFromIndices(rawLandmarks, REGION_LANDMARK_INDICES.lips),
      // All normalized landmarks
      landmarks: rawLandmarks.map(p => ({ x: Number(p.x.toFixed(4)), y: Number(p.y.toFixed(4)), z: Number(p.z.toFixed(4)) }))
    };

    return {
      hasFace: true,
      landmarks: rawLandmarks,
      regions,
      tesselation: FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      contours: FaceLandmarker.FACE_LANDMARKS_CONTOURS,
      error: null
    };

  } catch (err) {
    console.error("Error during MediaPipe landmark detection:", err);
    return {
      hasFace: false,
      landmarks: null,
      regions: null,
      meshConnections: null,
      error: err.message || "Failed to detect facial landmarks."
    };
  }
}

function extractPolygonFromIndices(landmarks, indices) {
  if (!indices || !landmarks) return [];
  return indices
    .filter(idx => idx < landmarks.length)
    .map(idx => ({
      x: Number(landmarks[idx].x.toFixed(4)),
      y: Number(landmarks[idx].y.toFixed(4))
    }));
}
