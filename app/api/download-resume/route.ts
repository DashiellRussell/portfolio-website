import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
    try {
        // Read the PDF file from the public directory
        const pdfPath = join(process.cwd(), 'public', 'Dashiell-Russell-Resume.pdf')
        const pdfBuffer = await readFile(pdfPath)

        // Create response with proper headers for download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="Dashiell-Russell-Resume.pdf"',
                'Content-Length': pdfBuffer.length.toString(),
            },
        })
    } catch (error) {
        console.error('Error downloading resume:', error)
        return new NextResponse('Failed to download resume', { status: 500 })
    }
}
