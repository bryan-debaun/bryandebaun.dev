/**
 * ⚠️ DEPRECATED: The MCP server no longer provides /api/ratings endpoint.
 * Ratings are now embedded directly in entities (Book, Movie, VideoGame).
 * This route returns an empty response for backward compatibility.
 */

import { NextResponse } from 'next/server';

export async function GET() {
    console.warn('/api/mcp/ratings is deprecated. Ratings are now embedded in entities.');
    return NextResponse.json({ ratings: [], total: 0 });
}
