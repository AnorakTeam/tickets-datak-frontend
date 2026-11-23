output "frontend_url" {
  description = "Public URL of the deployed Nuxt Frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "artifact_registry_repo" {
  description = "Docker repository path in Artifact Registry"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}

output "service_account_email" {
  description = "Service account assigned to the Cloud Run service"
  value       = google_service_account.frontend_sa.email
}
