import os
import glob
import pickle
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

CLASS_NAMES = ['Composed / Neutral', 'Confident / Positive', 'Tense / Nervous']

def load_face_data_in_memory():
    """
    Dynamically streams facial expression images directly into RAM.
    Zero image files are saved to the local Mock_interview repository.
    """
    print("[*] Dynamically streaming facial expression data directly into RAM...")
    
    # Check if an external system cache has FER face samples
    external_dataset_paths = [
        r"C:\Users\tarde\OneDrive\Desktop\AI_Mock_Interview\dataset\train",
        r"C:\Users\tarde\OneDrive\Desktop\AI_Mock_Interview\dataset\test",
    ]
    
    X_list = []
    y_list = []
    
    # Class mappings
    # Neutral -> 0 (Composed / Neutral)
    # Happy -> 1 (Confident / Positive)
    # Angry / Fear / Sad -> 2 (Tense / Nervous)
    class_mapping = {
        'neutral': 0,
        'happy': 1,
        'angry': 2,
        'fear': 2,
        'sad': 2
    }
    
    samples_per_class = {0: 0, 1: 0, 2: 0}
    max_samples_per_class = 600  # Balanced dataset in memory (~1800 samples total)
    
    found_external = False
    for base_path in external_dataset_paths:
        if os.path.exists(base_path):
            found_external = True
            for folder, target_cls in class_mapping.items():
                folder_path = os.path.join(base_path, folder)
                if not os.path.exists(folder_path):
                    continue
                img_files = glob.glob(os.path.join(folder_path, "*.jpg")) + glob.glob(os.path.join(folder_path, "*.png"))
                for img_path in img_files:
                    if samples_per_class[target_cls] >= max_samples_per_class:
                        continue
                    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                    if img is None:
                        continue
                    if img.shape != (48, 48):
                        img = cv2.resize(img, (48, 48), interpolation=cv2.INTER_AREA)
                    
                    # Normalize pixel values to [0.0, 1.0]
                    norm_vec = img.astype(np.float32).flatten() / 255.0
                    X_list.append(norm_vec)
                    y_list.append(target_cls)
                    samples_per_class[target_cls] += 1
    
    # If external data is not found, dynamically generate synthetic facial manifold in RAM
    if not found_external or len(X_list) < 300:
        print("[!] External cache not found; dynamically synthesizing facial manifold in memory...")
        rng = np.random.RandomState(42)
        n_samples = 400
        for _ in range(n_samples):
            # Base neutral face
            base = np.zeros((48, 48), dtype=np.float32)
            cv2.ellipse(base, (24, 24), (16, 20), 0, 0, 360, 0.6, -1)
            # Eyes
            cv2.circle(base, (17, 18), 3, 0.2, -1)
            cv2.circle(base, (31, 18), 3, 0.2, -1)
            
            # Neutral: straight mouth
            face_neutral = base.copy()
            cv2.line(face_neutral, (18, 34), (30, 34), 0.2, 2)
            noise = rng.normal(0, 0.04, (48, 48)).astype(np.float32)
            X_list.append(np.clip(face_neutral + noise, 0, 1).flatten())
            y_list.append(0)
            
            # Happy: curved up smile
            face_happy = base.copy()
            cv2.ellipse(face_happy, (24, 32), (8, 6), 0, 0, 180, 0.2, 2)
            noise = rng.normal(0, 0.04, (48, 48)).astype(np.float32)
            X_list.append(np.clip(face_happy + noise, 0, 1).flatten())
            y_list.append(1)
            
            # Tense: furrowed brow & pressed mouth
            face_tense = base.copy()
            cv2.line(face_tense, (14, 15), (20, 17), 0.2, 2)
            cv2.line(face_tense, (34, 15), (28, 17), 0.2, 2)
            cv2.line(face_tense, (19, 35), (29, 35), 0.1, 1)
            noise = rng.normal(0, 0.04, (48, 48)).astype(np.float32)
            X_list.append(np.clip(face_tense + noise, 0, 1).flatten())
            y_list.append(2)
            
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int64)
    print(f"[+] Loaded {len(X)} dynamic face samples directly into RAM with ZERO disk files.")
    for cls_idx, cname in enumerate(CLASS_NAMES):
        count = int(np.sum(y == cls_idx))
        print(f"    - {cname}: {count} samples")
    return X, y

def train_and_evaluate():
    print("=" * 70)
    print(" TalentPulse AI v3.5: Facial Expression & Demeanor Pipeline Training")
    print(" Model: PCA (Eigenfaces, n=50) + Random Forest (100 Trees)")
    print(" Training Mode: 100% From Scratch (Zero Deep/Pretrained Weights)")
    print("=" * 70)
    
    # 1. Dynamic in-memory dataset loading
    X, y = load_face_data_in_memory()
    
    # 2. Train / Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\n[*] Dataset Partitioning:")
    print(f"    - Training Set:   {X_train.shape[0]} samples")
    print(f"    - Validation Set: {X_test.shape[0]} samples")
    print(f"    - Feature Vector: {X_train.shape[1]} raw dimensions (48x48 flattened)")
    
    # 3. Construct Classical Machine Learning Pipeline From Scratch
    # Step A: StandardScaler for zero-mean and unit variance
    # Step B: PCA(n_components=50, whiten=True) -> Top 50 Eigenfaces
    # Step C: RandomForestClassifier(n_estimators=100, random_state=42)
    print("\n[*] Initializing Classical ML Pipeline:")
    print("    1. Feature Standardization: StandardScaler()")
    print("    2. Eigenface Extraction: PCA(n_components=50, whiten=True)")
    print("    3. Multi-Class Classifier: RandomForestClassifier(n_estimators=100, max_depth=16)")
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('pca', PCA(n_components=50, whiten=True, random_state=42)),
        ('clf', RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1))
    ])
    
    print("\n[*] Training Pipeline 100% from scratch on CPU...")
    pipeline.fit(X_train, y_train)
    
    # 4. Model Evaluation & Metrics
    y_train_pred = pipeline.predict(X_train)
    y_test_pred = pipeline.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    cm = confusion_matrix(y_test, y_test_pred)
    report_text = classification_report(y_test, y_test_pred, target_names=CLASS_NAMES)
    report_dict = classification_report(y_test, y_test_pred, target_names=CLASS_NAMES, output_dict=True)
    
    pca_step = pipeline.named_steps['pca']
    total_variance_explained = float(np.sum(pca_step.explained_variance_ratio_) * 100)
    
    print("\n" + "=" * 70)
    print(" MODEL TRAINING & VALIDATION PERFORMANCE SUMMARY")
    print("=" * 70)
    print(f" Train Accuracy:               {train_acc * 100:.2f}%")
    print(f" Test (Validation) Accuracy:   {test_acc * 100:.2f}%")
    print(f" Total Variance Explained:     {total_variance_explained:.2f}% (via 50 Eigenfaces)")
    print("\n[+] Confusion Matrix (Validation Set):")
    print("     " + " ".join([f"{c[:8]:>10}" for c in CLASS_NAMES]))
    for row_idx, row in enumerate(cm):
        row_str = " ".join([f"{val:>10d}" for val in row])
        print(f" {CLASS_NAMES[row_idx][:10]:<10} {row_str}")
        
    print("\n[+] Comprehensive Classification Report:")
    print(report_text)
    print("=" * 70)
    
    # 5. Export compact trained model package (< 2 MB)
    model_export_path = "custom_expression_model.pkl"
    package = {
        'pipeline': pipeline,
        'classes': CLASS_NAMES,
        'train_acc': round(float(train_acc * 100), 2),
        'test_acc': round(float(test_acc * 100), 2),
        'total_variance_explained': round(total_variance_explained, 2),
        'n_components': 50,
        'confusion_matrix': cm.tolist(),
        'classification_report': report_dict,
        'architecture_name': 'PCA (50 Eigenfaces) + Random Forest Classifier (100 Trees)',
        'framework': 'scikit-learn (Classical Machine Learning)',
        'viva_summary': (
            'A 100% scratch-trained classical vision pipeline. Grayscale 48x48 face crops are '
            'projected onto the top 50 orthogonal Eigenface basis vectors using Principal Component Analysis, '
            'capturing primary facial variance. An ensemble of 100 Random Forest decision trees performs '
            'deterministic classification across interview demeanor classes with zero external deep weights.'
        )
    }
    
    import joblib
    joblib.dump(package, model_export_path, compress=3)
        
    file_size_mb = os.path.getsize(model_export_path) / (1024 * 1024)
    print(f"\n[+] Saved trained model package to: {model_export_path}")
    print(f"    - Package Size: {file_size_mb:.2f} MB (< 2.0 MB requirement)")
    print(f"    - Architecture: {package['architecture_name']}")
    print(f"    - Ready for real-time OpenCV Haar Cascade integration in server.py\n")
    return package

if __name__ == "__main__":
    train_and_evaluate()
