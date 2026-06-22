# GCP & GitHub Actions Deployment Setup Guide

This guide details all the steps required to set up your Google Cloud Platform (GCP) project and your GitHub repository for automated deployments of **Bimbimappa** to GCP Cloud Run.

---

## Step 1: Enable Required GCP APIs
Open your terminal (with `gcloud` installed) or use the GCP Cloud Shell, and enable the necessary services for Artifact Registry, Cloud Run, and Workload Identity Federation:

```bash
# Set your active project
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable the required APIs
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  iamcredentials.googleapis.com
```

---

## Step 2: Create Artifact Registry Repository
Your GitHub Action pushes the built Docker image to GCP Artifact Registry. Create a Docker repository named `bimbimappa` in the `us-central1` region:

```bash
gcloud artifacts repositories create bimbimappa \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for Bimbimappa"
```

---

## Step 3: Configure Workload Identity Federation (Secure Auth)
Workload Identity Federation allows GitHub Actions to securely access GCP resources without using long-lived Service Account JSON keys.

### 1. Create a Workload Identity Pool
```bash
gcloud iam workload-identity-pools create github-actions-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 2. Create a Workload Identity Provider inside the Pool
```bash
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 3. Create a Service Account for Deployment
```bash
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer"
```

### 4. Authorize GitHub to Impersonate the Service Account
Allow GitHub Actions workflows originating from your specific repository to impersonate the service account:

```bash
gcloud iam service-accounts add-iam-policy-binding github-deployer@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/YOUR_GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/papesce/bimbimappa"
```
> [!NOTE]
> * Replace `YOUR_GCP_PROJECT_ID` with your project string (e.g. `my-project-123`).
> * Replace `YOUR_GCP_PROJECT_NUMBER` with your numeric project ID (e.g. `123456789012`). You can find this in the GCP Console dashboard or by running `gcloud projects describe YOUR_GCP_PROJECT_ID`.

---

## Step 4: Grant IAM Permissions to the Service Account
The deployer service account needs permissions to push images to Artifact Registry, deploy to Cloud Run, and assign the default runtime service account.

```bash
# 1. Allow pushing to Artifact Registry
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member="serviceAccount:github-deployer@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# 2. Allow deploying to Cloud Run
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member="serviceAccount:github-deployer@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# 3. Allow access to act as the runtime service account (usually the Compute Engine default service account)
# Replace YOUR_PROJECT_NUMBER with your numeric project ID
gcloud iam service-accounts add-iam-policy-binding YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --member="serviceAccount:github-deployer@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

## Step 5: Configure GitHub Secrets
Go to your GitHub Repository page and navigate to **Settings > Secrets and variables > Actions > Secrets tab > New repository secret** and add the following secrets:

| Secret Name | Value Example / Description |
| :--- | :--- |
| `GCP_PROJECT_ID` | `my-awesome-project-12345` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-deployer@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com` |
| `VITE_SUPABASE_URL` | `https://your-supabase-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *Your public/anon Supabase Key* |
| `VITE_GOOGLE_PLACES_API_KEY` | *Your Google Maps/Places API Key* |
| `VITE_HOUSEHOLD_TOKEN` | *Your family household token identifier* |

---

## Step 6: Trigger Deployment
Push any changes to the `main` branch, or manually trigger the action via the **Actions** tab in GitHub to deploy. Your app will build, upload, and deploy to Cloud Run!
