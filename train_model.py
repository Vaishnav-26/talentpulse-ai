import os
import sys
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

def main():
    print("=" * 60)
    print("TalentPulse AI - PyTorch FER-2013 ResNet18 Training Pipeline")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[+] Utilizing compute device: {device}")

    # Paths to FER-2013 dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    train_dir = os.path.join(base_dir, "dataset", "train")
    test_dir = os.path.join(base_dir, "dataset", "test")
    model_save_path = os.path.join(base_dir, "fer2013_resnet.pth")

    print(f"[+] Train Dataset Dir: {train_dir}")
    print(f"[+] Test Dataset Dir:  {test_dir}")

    # Image transformations: Convert grayscale/RGB to 3-channel 48x48 tensor for ResNet18
    train_transforms = transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((48, 48)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    test_transforms = transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((48, 48)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    print("[+] Loading FER-2013 datasets...")
    train_dataset = datasets.ImageFolder(root=train_dir, transform=train_transforms)
    test_dataset = datasets.ImageFolder(root=test_dir, transform=test_transforms)

    num_classes = len(train_dataset.classes)
    print(f"[+] Detected {num_classes} Emotion Classes: {train_dataset.classes}")
    print(f"[+] Training Samples: {len(train_dataset)} | Test Samples: {len(test_dataset)}")

    # Data loaders
    batch_size = 64
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Initialize ResNet18 model
    print("[+] Building ResNet18 Architecture...")
    try:
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    except Exception as e:
        print(f"[!] Network download fallback: initializing ResNet18 without pre-trained weights ({e})")
        model = models.resnet18(weights=None)

    # Modify final fully-connected layer for FER-2013 7 emotion classes
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    model = model.to(device)

    # Loss function & Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)

    epochs = 5
    print(f"\n[START] Starting Training for {epochs} Epochs...\n")

    start_time = time.time()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        
        # Training Phase
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += (preds == labels).sum().item()
            total_train += labels.size(0)

        train_loss = running_loss / total_train
        train_acc = (correct_train / total_train) * 100.0

        # Evaluation Phase on Test Set
        model.eval()
        running_test_loss = 0.0
        correct_test = 0
        total_test = 0

        with torch.no_grad():
            for images, labels in test_loader:
                images, labels = images.to(device), labels.to(device)

                outputs = model(images)
                loss = criterion(outputs, labels)

                running_test_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_test += (preds == labels).sum().item()
                total_test += labels.size(0)

        test_loss = running_test_loss / total_test
        test_acc = (correct_test / total_test) * 100.0

        scheduler.step()
        epoch_dur = time.time() - epoch_start

        print(f"Epoch [{epoch}/{epochs}] ({epoch_dur:.1f}s) | "
              f"Train Loss: {train_loss:.4f} - Train Acc: {train_acc:.2f}% | "
              f"Test Loss: {test_loss:.4f} - Test Acc: {test_acc:.2f}%")

    total_dur = time.time() - start_time
    print(f"\n[OK] Training completed in {total_dur:.1f} seconds!")

    # Save trained weights
    print(f"[+] Saving model weights to: {model_save_path}")
    torch.save(model.state_dict(), model_save_path)
    print("[OK] Model weights saved successfully!")

if __name__ == "__main__":
    main()
