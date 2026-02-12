export declare enum ItemStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED"
}
export interface VideoGame {
    /** @format double */
    id: number;
    title: string;
    status: string;
    description?: string;
    platform: string;
    igdbId?: string;
    releasedAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ListVideoGamesResponse {
    videoGames: VideoGame[];
    /** @format double */
    total: number;
}
export interface CreateVideoGameRequest {
    title: string;
    platform: string;
    description?: string;
    igdbId?: string;
    releasedAt?: string;
    status?: string;
}
export interface UpdateVideoGameRequest {
    /** @format double */
    id: number;
    title?: string;
    platform?: string;
    description?: string;
    igdbId?: string;
    releasedAt?: string;
    status?: string;
}
/** Rating with book and user details */
export interface RatingWithDetails {
    /** @format double */
    id: number;
    /** @format double */
    bookId: number;
    /** @format double */
    userId: number;
    /** @format double */
    rating: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
    book?: {
        title: string;
        /** @format double */
        id: number;
    };
    user?: {
        email: string;
        /** @format double */
        id: number;
    };
}
/** List ratings response */
export interface ListRatingsResponse {
    ratings: RatingWithDetails[];
    /** @format double */
    total: number;
}
/** Rating representation */
export interface Rating {
    /** @format double */
    id: number;
    /** @format double */
    bookId: number;
    /** @format double */
    userId: number;
    /** @format double */
    rating: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
}
/** Create or update rating request */
export interface CreateRatingRequest {
    /** @format double */
    bookId: number;
    /** @format double */
    rating: number;
    review?: string;
}
export interface Movie {
    /** @format double */
    id: number;
    title: string;
    status: string;
    description?: string;
    iasn?: string;
    imdbId?: string;
    releasedAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ListMoviesResponse {
    movies: Movie[];
    /** @format double */
    total: number;
}
export interface CreateMovieRequest {
    title: string;
    description?: string;
    iasn?: string;
    imdbId?: string;
    releasedAt?: string;
    status?: string;
}
export interface UpdateMovieRequest {
    /** @format double */
    id: number;
    title?: string;
    description?: string;
    iasn?: string;
    imdbId?: string;
    releasedAt?: string;
    status?: string;
}
export interface SendMagicLinkRequest {
    email: string;
}
export interface RegisterRequest {
    email: string;
    name?: string;
    password?: string;
}
export interface ContentCreator {
    /** @format double */
    id: number;
    name: string;
    description?: string;
    website?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ListContentCreatorsResponse {
    creators: ContentCreator[];
    /** @format double */
    total: number;
}
export interface CreateContentCreatorRequest {
    name: string;
    description?: string;
    website?: string;
}
export interface UpdateContentCreatorRequest {
    /** @format double */
    id: number;
    name?: string;
    description?: string;
    website?: string;
}
/** Book with author information */
export interface BookWithAuthors {
    /** @format double */
    id: number;
    title: string;
    description?: string;
    isbn?: string;
    publishedAt?: string;
    status: ItemStatus;
    createdAt: string;
    updatedAt: string;
    /** @format double */
    averageRating?: number | null;
    /** @format double */
    ratingCount?: number;
    authors?: {
        name: string;
        /** @format double */
        id: number;
    }[];
}
/** List books response */
export interface ListBooksResponse {
    books: BookWithAuthors[];
    /** @format double */
    total: number;
}
/** Book representation */
export interface Book {
    /** @format double */
    id: number;
    title: string;
    description?: string;
    isbn?: string;
    publishedAt?: string;
    status: ItemStatus;
    createdAt: string;
    updatedAt: string;
    /** @format double */
    averageRating?: number | null;
    /** @format double */
    ratingCount?: number;
}
/** Create book request */
export interface CreateBookRequest {
    title: string;
    status?: ItemStatus;
    description?: string;
    isbn?: string;
    publishedAt?: string;
    authorIds?: number[];
}
/** Update book request */
export interface UpdateBookRequest {
    title?: string;
    status?: ItemStatus;
    description?: string;
    isbn?: string;
    publishedAt?: string;
    authorIds?: number[];
}
/** Author with books */
export interface AuthorWithBooks {
    /** @format double */
    id: number;
    name: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
    books?: {
        title: string;
        /** @format double */
        id: number;
    }[];
}
/** List authors response */
export interface ListAuthorsResponse {
    authors: AuthorWithBooks[];
    /** @format double */
    total: number;
}
/** Author representation */
export interface Author {
    /** @format double */
    id: number;
    name: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}
/** Create author request */
export interface CreateAuthorRequest {
    name: string;
    bio?: string;
    website?: string;
}
/** Update author request */
export interface UpdateAuthorRequest {
    name?: string;
    bio?: string;
    website?: string;
}
export interface AdminUser {
    /** @format double */
    id: number;
    email: string;
    name?: string | null;
    role?: string | null;
    blocked?: boolean;
    isAdmin?: boolean;
}
export interface UpdateAdminUserRequest {
    role?: string;
    blocked?: boolean;
}
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, ResponseType } from "axios";
export type QueryParamsType = Record<string | number, any>;
export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
    /** set parameter to `true` for call `securityWorker` for this request */
    secure?: boolean;
    /** request path */
    path: string;
    /** content type of request body */
    type?: ContentType;
    /** query params */
    query?: QueryParamsType;
    /** format of response (i.e. response.json() -> format: "json") */
    format?: ResponseType;
    /** request body */
    body?: unknown;
}
export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;
export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
    securityWorker?: (securityData: SecurityDataType | null) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
    secure?: boolean;
    format?: ResponseType;
}
export declare enum ContentType {
    Json = "application/json",
    JsonApi = "application/vnd.api+json",
    FormData = "multipart/form-data",
    UrlEncoded = "application/x-www-form-urlencoded",
    Text = "text/plain"
}
export declare class HttpClient<SecurityDataType = unknown> {
    instance: AxiosInstance;
    private securityData;
    private securityWorker?;
    private secure?;
    private format?;
    constructor({ securityWorker, secure, format, ...axiosConfig }?: ApiConfig<SecurityDataType>);
    setSecurityData: (data: SecurityDataType | null) => void;
    protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig;
    protected stringifyFormItem(formItem: unknown): string;
    protected createFormData(input: Record<string, unknown>): FormData;
    request: <T = any, _E = any>({ secure, path, type, query, format, body, ...params }: FullRequestParams) => Promise<AxiosResponse<T>>;
}
/**
 * @title MCP Server API
 * @version 0.1.0
 * @license MIT
 * @baseUrl /
 * @contact Bryan DeBaun <bryan@debaun.dev>
 *
 * REST API for MCP Server with books, authors, ratings, and admin operations
 */
export declare class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    api: {
        /**
         * No description
         *
         * @tags VideoGames
         * @name ListVideoGames
         * @request GET:/api/videogames
         */
        listVideoGames: (query?: {
            platform?: string;
            search?: string;
            /** @format double */
            limit?: number;
            /** @format double */
            offset?: number;
        }, params?: RequestParams) => Promise<AxiosResponse<ListVideoGamesResponse, any, {}>>;
        /**
         * No description
         *
         * @tags VideoGames
         * @name CreateVideoGame
         * @request POST:/api/videogames
         * @secure
         */
        createVideoGame: (data: CreateVideoGameRequest, params?: RequestParams) => Promise<AxiosResponse<VideoGame, any, {}>>;
        /**
         * No description
         *
         * @tags VideoGames
         * @name GetVideoGame
         * @request GET:/api/videogames/{id}
         */
        getVideoGame: (id: number, params?: RequestParams) => Promise<AxiosResponse<VideoGame, any, {}>>;
        /**
         * No description
         *
         * @tags VideoGames
         * @name UpdateVideoGame
         * @request PUT:/api/videogames/{id}
         * @secure
         */
        updateVideoGame: (id: number, data: UpdateVideoGameRequest, params?: RequestParams) => Promise<AxiosResponse<VideoGame, any, {}>>;
        /**
         * No description
         *
         * @tags VideoGames
         * @name DeleteVideoGame
         * @request DELETE:/api/videogames/{id}
         * @secure
         */
        deleteVideoGame: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
        /**
         * @description Returns current user session (based on `session` cookie).
         *
         * @tags Auth
         * @name Get
         * @request GET:/api/auth/session
         */
        get: (params?: RequestParams) => Promise<AxiosResponse<any, any, {}>>;
        /**
         * @description List ratings with optional filtering
         *
         * @tags Ratings
         * @name ListRatings
         * @summary Get a list of ratings
         * @request GET:/api/ratings
         */
        listRatings: (query?: {
            /**
             * Filter by book ID
             * @format double
             */
            bookId?: number;
            /**
             * Filter by user ID
             * @format double
             */
            userId?: number;
            /**
             * Minimum rating value (1-10)
             * @format double
             */
            minRating?: number;
            /**
             * Maximum number of results (default 50)
             * @format double
             */
            limit?: number;
            /**
             * Number of results to skip (default 0)
             * @format double
             */
            offset?: number;
        }, params?: RequestParams) => Promise<AxiosResponse<ListRatingsResponse, any, {}>>;
        /**
         * @description Create or update a rating (authenticated users)
         *
         * @tags Ratings
         * @name CreateRating
         * @summary Create or update a rating for a book
         * @request POST:/api/ratings
         * @secure
         */
        createRating: (data: CreateRatingRequest, params?: RequestParams) => Promise<AxiosResponse<Rating, any, {}>>;
        /**
         * @description Delete a rating (owner or admin only)
         *
         * @tags Ratings
         * @name DeleteRating
         * @summary Delete a rating by ID
         * @request DELETE:/api/ratings/{id}
         * @secure
         */
        deleteRating: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
        /**
         * No description
         *
         * @tags Movies
         * @name ListMovies
         * @request GET:/api/movies
         */
        listMovies: (query?: {
            status?: string;
            search?: string;
            /** @format double */
            limit?: number;
            /** @format double */
            offset?: number;
        }, params?: RequestParams) => Promise<AxiosResponse<ListMoviesResponse, any, {}>>;
        /**
         * No description
         *
         * @tags Movies
         * @name CreateMovie
         * @request POST:/api/movies
         * @secure
         */
        createMovie: (data: CreateMovieRequest, params?: RequestParams) => Promise<AxiosResponse<Movie, any, {}>>;
        /**
         * No description
         *
         * @tags Movies
         * @name GetMovie
         * @request GET:/api/movies/{id}
         */
        getMovie: (id: number, params?: RequestParams) => Promise<AxiosResponse<Movie, any, {}>>;
        /**
         * No description
         *
         * @tags Movies
         * @name UpdateMovie
         * @request PUT:/api/movies/{id}
         * @secure
         */
        updateMovie: (id: number, data: UpdateMovieRequest, params?: RequestParams) => Promise<AxiosResponse<Movie, any, {}>>;
        /**
         * No description
         *
         * @tags Movies
         * @name DeleteMovie
         * @request DELETE:/api/movies/{id}
         * @secure
         */
        deleteMovie: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
        /**
         * @description Send a magic link email (returns 202 accepted)
         *
         * @tags Auth
         * @name Send
         * @request POST:/api/auth/magic-link
         */
        send: (data: SendMagicLinkRequest, params?: RequestParams) => Promise<AxiosResponse<{
            status: "accepted";
        }, any, {}>>;
        /**
         * @description Public registration endpoint
         *
         * @tags Auth
         * @name Register
         * @request POST:/api/auth/magic-link/register
         */
        register: (data: RegisterRequest, params?: RequestParams) => Promise<AxiosResponse<any, any, {}>>;
        /**
         * @description Verify a magic link token (GET redirect style)
         *
         * @tags Auth
         * @name VerifyGet
         * @request GET:/api/auth/magic-link/verify
         */
        verifyGet: (query: {
            token: string;
        }, params?: RequestParams) => Promise<AxiosResponse<void, any, {}>>;
        /**
         * @description Verify a magic link token (POST JSON style)
         *
         * @tags Auth
         * @name VerifyPost
         * @request POST:/api/auth/magic-link/verify
         */
        verifyPost: (data: {
            token?: string;
        }, params?: RequestParams) => Promise<AxiosResponse<{
            status: "ok";
        }, any, {}>>;
        /**
         * No description
         *
         * @tags ContentCreators
         * @name ListContentCreators
         * @request GET:/api/content-creators
         */
        listContentCreators: (query?: {
            search?: string;
            /** @format double */
            limit?: number;
            /** @format double */
            offset?: number;
        }, params?: RequestParams) => Promise<AxiosResponse<ListContentCreatorsResponse, any, {}>>;
        /**
         * No description
         *
         * @tags ContentCreators
         * @name CreateContentCreator
         * @request POST:/api/content-creators
         * @secure
         */
        createContentCreator: (data: CreateContentCreatorRequest, params?: RequestParams) => Promise<AxiosResponse<ContentCreator, any, {}>>;
        /**
         * No description
         *
         * @tags ContentCreators
         * @name GetContentCreator
         * @request GET:/api/content-creators/{id}
         */
        getContentCreator: (id: number, params?: RequestParams) => Promise<AxiosResponse<ContentCreator, any, {}>>;
        /**
         * No description
         *
         * @tags ContentCreators
         * @name UpdateContentCreator
         * @request PUT:/api/content-creators/{id}
         * @secure
         */
        updateContentCreator: (id: number, data: UpdateContentCreatorRequest, params?: RequestParams) => Promise<AxiosResponse<ContentCreator, any, {}>>;
        /**
         * No description
         *
         * @tags ContentCreators
         * @name DeleteContentCreator
         * @request DELETE:/api/content-creators/{id}
         * @secure
         */
        deleteContentCreator: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
        /**
         * @description List books with optional filtering
         *
         * @tags Books
         * @name ListBooks
         * @summary Get a list of books
         * @request GET:/api/books
         */
        listBooks: (query?: {
            /**
             * Filter by author ID
             * @format double
             */
            authorId?: number;
            /**
             * Minimum average rating (1-10)
             * @format double
             */
            minRating?: number;
            /** Search in title and description */
            search?: string;
            status?: ItemStatus;
            /**
             * Maximum number of results (default 50)
             * @format double
             */
            limit?: number;
            /**
             * Number of results to skip (default 0)
             * @format double
             */
            offset?: number;
        }, params?: RequestParams) => Promise<AxiosResponse<ListBooksResponse, any, {}>>;
        /**
         * @description Create a new book (admin only)
         *
         * @tags Books
         * @name CreateBook
         * @summary Create a new book
         * @request POST:/api/books
         * @secure
         */
        createBook: (data: CreateBookRequest, params?: RequestParams) => Promise<AxiosResponse<Book, any, {}>>;
        /**
         * @description Get a book by ID
         *
         * @tags Books
         * @name GetBook
         * @summary Get book details by ID
         * @request GET:/api/books/{id}
         */
        getBook: (id: number, params?: RequestParams) => Promise<AxiosResponse<BookWithAuthors, any, {}>>;
        /**
         * @description Update a book (admin only)
         *
         * @tags Books
         * @name UpdateBook
         * @summary Update an existing book
         * @request PUT:/api/books/{id}
         * @secure
         */
        updateBook: (id: number, data: UpdateBookRequest, params?: RequestParams) => Promise<AxiosResponse<Book, any, {}>>;
        /**
         * @description Delete a book (admin only)
         *
         * @tags Books
         * @name DeleteBook
         * @summary Delete a book by ID
         * @request DELETE:/api/books/{id}
         * @secure
         */
        deleteBook: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
        /**
         * @description List authors with optional filtering
         *
         * @tags Authors
         * @name ListAuthors
         * @summary Get a list of authors
         * @request GET:/api/authors
         */
        listAuthors: (query?: {
            /** Search in author name */
            search?: string;
            /**
             * Maximum number of results (default 50)
             * @format double
             */
            limit?: number;
            /**
             * Number of results to skip (default 0)
             * @format double
             */
            offset?: number;
        }, params?: RequestParams) => Promise<AxiosResponse<ListAuthorsResponse, any, {}>>;
        /**
         * @description Create a new author (admin only)
         *
         * @tags Authors
         * @name CreateAuthor
         * @summary Create a new author
         * @request POST:/api/authors
         * @secure
         */
        createAuthor: (data: CreateAuthorRequest, params?: RequestParams) => Promise<AxiosResponse<Author, any, {}>>;
        /**
         * @description Get an author by ID
         *
         * @tags Authors
         * @name GetAuthor
         * @summary Get author details by ID
         * @request GET:/api/authors/{id}
         */
        getAuthor: (id: number, params?: RequestParams) => Promise<AxiosResponse<AuthorWithBooks, any, {}>>;
        /**
         * @description Update an author (admin only)
         *
         * @tags Authors
         * @name UpdateAuthor
         * @summary Update an existing author
         * @request PUT:/api/authors/{id}
         * @secure
         */
        updateAuthor: (id: number, data: UpdateAuthorRequest, params?: RequestParams) => Promise<AxiosResponse<Author, any, {}>>;
        /**
         * @description Delete an author (admin only)
         *
         * @tags Authors
         * @name DeleteAuthor
         * @summary Delete an author by ID
         * @request DELETE:/api/authors/{id}
         * @secure
         */
        deleteAuthor: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
        /**
         * @description Update a user's role or blocked state (admin only)
         *
         * @tags Admin
         * @name PatchUser
         * @request PATCH:/api/admin/users/{id}
         * @secure
         */
        patchUser: (id: number, data: UpdateAdminUserRequest, params?: RequestParams) => Promise<AxiosResponse<AdminUser, any, {}>>;
        /**
         * @description Delete a user (soft-delete by default). Use ?hard=1 to attempt hard delete.
         *
         * @tags Admin
         * @name DeleteUser
         * @request DELETE:/api/admin/users/{id}
         * @secure
         */
        deleteUser: (id: number, params?: RequestParams) => Promise<AxiosResponse<{
            success: boolean;
        }, any, {}>>;
    };
}
