import time
import tracemalloc
import numpy as np
from PIL import Image, ImageDraw
from app.services.quality_service import validate_image_quality
from app.services.landmark_service import generate_fallback_regions
from app.services.mask_service import rasterize_region_masks, create_annotated_region_overlay
from app.services.acne_service import acne_adapter
from app.services.visual_indicator_service import calculate_all_visual_indicators
from app.services.scoring_service import calculate_visual_concern_index
from app.services.safety_service import generate_wellness_guidance


def run_performance_benchmark(iterations: int = 5):
    print("=" * 60)
    print("SkinSense AI — System Performance & Latency Benchmark")
    print("=" * 60)

    # 1. Synthesize a 1080p realistic facial test image
    t0 = time.perf_counter()
    w, h = 1080, 1080
    img = Image.new("RGB", (w, h), color=(235, 195, 175))
    draw = ImageDraw.Draw(img)
    draw.rectangle([350, 360, 480, 390], fill=(80, 50, 40))
    draw.rectangle([600, 360, 730, 390], fill=(80, 50, 40))
    draw.ellipse([300, 450, 460, 620], fill=(235, 155, 145))
    draw.ellipse([620, 450, 780, 620], fill=(235, 155, 145))
    draw.ellipse([460, 720, 620, 770], fill=(190, 80, 80))
    # Simulated blemish
    draw.ellipse([500, 500, 530, 530], fill=(195, 55, 50))
    t_synth = (time.perf_counter() - t0) * 1000

    tracemalloc.start()

    decode_times = []
    quality_times = []
    landmark_mask_times = []
    acne_inference_times = []
    indicators_times = []
    scoring_times = []
    safety_times = []
    overlay_times = []
    total_latencies = []

    for i in range(iterations):
        t_start = time.perf_counter()

        # Step 1: Decode / Convert
        t1 = time.perf_counter()
        img_copy = img.copy()
        rgb_arr = np.array(img_copy.convert("RGB"))
        t2 = time.perf_counter()
        decode_times.append((t2 - t1) * 1000)

        # Step 2: Quality validation
        t3 = time.perf_counter()
        regions = generate_fallback_regions(w, h)
        q_res = validate_image_quality(img_copy, regions)
        t4 = time.perf_counter()
        quality_times.append((t4 - t3) * 1000)

        # Step 3: Landmark & Mask rasterization
        t5 = time.perf_counter()
        masks = rasterize_region_masks(w, h, regions)
        t6 = time.perf_counter()
        landmark_mask_times.append((t6 - t5) * 1000)

        # Step 4: Model Inference
        t7 = time.perf_counter()
        acne_res = acne_adapter.detect(img_copy, region_masks=masks)
        t8 = time.perf_counter()
        acne_inference_times.append((t8 - t7) * 1000)

        # Step 5: Visual Indicators (CIE Lab)
        t9 = time.perf_counter()
        ind_res = calculate_all_visual_indicators(img_copy, masks)
        t10 = time.perf_counter()
        indicators_times.append((t10 - t9) * 1000)

        # Step 6: Visual Concern Index
        t11 = time.perf_counter()
        concern_res = calculate_visual_concern_index(acne_res, ind_res)
        t12 = time.perf_counter()
        scoring_times.append((t12 - t11) * 1000)

        # Step 7: Wellness & Safety Rules
        t13 = time.perf_counter()
        wellness_res = generate_wellness_guidance(concern_res, acne_res)
        t14 = time.perf_counter()
        safety_times.append((t14 - t13) * 1000)

        # Step 8: Overlay generation
        t15 = time.perf_counter()
        overlay = create_annotated_region_overlay(
            img_copy, regions, [d.model_dump() for d in acne_res.detections]
        )
        t16 = time.perf_counter()
        overlay_times.append((t16 - t15) * 1000)

        total_latencies.append((time.perf_counter() - t_start) * 1000)

    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    print(f"Image Resolution:               {w} x {h} (1080p full test frame)")
    print(f"Iterations Evaluated:           {iterations}")
    print("-" * 60)
    print(f"Image Decoding / Copy:          {np.mean(decode_times):.2f} ms ± {np.std(decode_times):.2f} ms")
    print(f"Quality Check (Blur/Exposure):  {np.mean(quality_times):.2f} ms ± {np.std(quality_times):.2f} ms")
    print(f"Landmark & Mask Rasterization:  {np.mean(landmark_mask_times):.2f} ms ± {np.std(landmark_mask_times):.2f} ms")
    print(f"YOLO Acne ONNX Model Inference: {np.mean(acne_inference_times):.2f} ms ± {np.std(acne_inference_times):.2f} ms")
    print(f"CIE Lab Visual Indicators:      {np.mean(indicators_times):.2f} ms ± {np.std(indicators_times):.2f} ms")
    print(f"Scoring Engine (VCI Index):     {np.mean(scoring_times):.2f} ms ± {np.std(scoring_times):.2f} ms")
    print(f"Wellness & Safety Rules:        {np.mean(safety_times):.2f} ms ± {np.std(safety_times):.2f} ms")
    print(f"Annotated Overlay Rendering:    {np.mean(overlay_times):.2f} ms ± {np.std(overlay_times):.2f} ms")
    print("-" * 60)
    print(f"TOTAL END-TO-END PIPELINE:      {np.mean(total_latencies):.2f} ms ({np.mean(total_latencies)/1000.0:.2f} s)")
    print(f"Target Threshold:               < 2500 ms (2.50 s)")
    print(f"Target Met:                     {'YES (PASSED)' if np.mean(total_latencies) < 2500 else 'NO'}")
    print(f"Peak Memory Usage:              {peak_mem / (1024 * 1024):.2f} MB")
    print("=" * 60)

    return {
        "mean_latency_ms": float(np.mean(total_latencies)),
        "inference_ms": float(np.mean(acne_inference_times)),
        "peak_memory_mb": float(peak_mem / (1024 * 1024)),
        "target_met": bool(np.mean(total_latencies) < 2500)
    }


if __name__ == "__main__":
    run_performance_benchmark()
