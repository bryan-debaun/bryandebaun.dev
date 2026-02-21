/**
 * ⚠️ DEPRECATED: The MCP server no longer provides standalone ratings endpoints.
 * Ratings are now embedded directly in entities (Book, Movie, VideoGame) as personal ratings.
 * Each entity has: rating, review, ratedAt fields.
 * 
 * This service is kept for backward compatibility but returns empty arrays.
 */

export type DeprecatedRatingWithDetails = {
    id: number;
    bookId: number;
    userId: number;
    rating: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
    book?: { title: string; id: number };
    user?: { email: string; id: number };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listRatings(_query?: { bookId?: number }): Promise<DeprecatedRatingWithDetails[]> {
    // The ratings endpoint no longer exists - return empty array
    console.warn('listRatings is deprecated. Ratings are now embedded in entities.');
    return [];
}
