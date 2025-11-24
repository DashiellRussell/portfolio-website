/**
 * Utility function to download files from the server
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error('Download failed')
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)

        // Create a temporary anchor element to trigger download
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
        console.error('Error downloading file:', error)
        throw error
    }
}

/**
 * Download the resume PDF
 */
export async function downloadResume(): Promise<void> {
    return downloadFile('/api/download-resume', 'Dashiell-Russell-Resume.pdf')
}
