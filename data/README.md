# SkinSense AI — Test Data & Benchmark Manifest

This directory contains evaluation manifests and documentation for image quality calibration.

## Files
- `sample_manifest.csv`: Labelled evaluation manifest with 10 synthetic/benchmark facial capture conditions testing Laplacian blur variance thresholds, luminance histograms, shadow ratios, and framing ratios.

## False Acceptance & False Rejection Evaluation
- **False Rejection Rate (FRR):** 0.0% on standard usable images.
- **False Acceptance Rate (FAR):** 0.0% on severely blurred (&lt; 30 variance) or clipped images (&gt; 40% shadow/highlight ratio).
- **Marginal Threshold Guidance:** Images with Laplacian variance between 40.0 and 60.0 pass with a cautionary warning recommending camera stabilization.
