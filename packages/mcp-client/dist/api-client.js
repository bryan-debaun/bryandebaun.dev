/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import axios from "axios";
export var ContentType;
(function (ContentType) {
    ContentType["Json"] = "application/json";
    ContentType["JsonApi"] = "application/vnd.api+json";
    ContentType["FormData"] = "multipart/form-data";
    ContentType["UrlEncoded"] = "application/x-www-form-urlencoded";
    ContentType["Text"] = "text/plain";
})(ContentType || (ContentType = {}));
export class HttpClient {
    constructor(_a = {}) {
        var { securityWorker, secure, format } = _a, axiosConfig = __rest(_a, ["securityWorker", "secure", "format"]);
        this.securityData = null;
        this.setSecurityData = (data) => {
            this.securityData = data;
        };
        this.request = async (_a) => {
            var { secure, path, type, query, format, body } = _a, params = __rest(_a, ["secure", "path", "type", "query", "format", "body"]);
            const secureParams = ((typeof secure === "boolean" ? secure : this.secure) &&
                this.securityWorker &&
                (await this.securityWorker(this.securityData))) ||
                {};
            const requestParams = this.mergeRequestParams(params, secureParams);
            const responseFormat = format || this.format || undefined;
            if (type === ContentType.FormData &&
                body &&
                body !== null &&
                typeof body === "object") {
                body = this.createFormData(body);
            }
            if (type === ContentType.Text &&
                body &&
                body !== null &&
                typeof body !== "string") {
                body = JSON.stringify(body);
            }
            return this.instance.request(Object.assign(Object.assign({}, requestParams), { headers: Object.assign(Object.assign({}, (requestParams.headers || {})), (type ? { "Content-Type": type } : {})), params: query, responseType: responseFormat, data: body, url: path }));
        };
        this.instance = axios.create(Object.assign(Object.assign({}, axiosConfig), { baseURL: axiosConfig.baseURL || "/" }));
        this.secure = secure;
        this.format = format;
        this.securityWorker = securityWorker;
    }
    mergeRequestParams(params1, params2) {
        const method = params1.method || (params2 && params2.method);
        return Object.assign(Object.assign(Object.assign(Object.assign({}, this.instance.defaults), params1), (params2 || {})), { headers: Object.assign(Object.assign(Object.assign({}, ((method &&
                this.instance.defaults.headers[method.toLowerCase()]) ||
                {})), (params1.headers || {})), ((params2 && params2.headers) || {})) });
    }
    stringifyFormItem(formItem) {
        if (typeof formItem === "object" && formItem !== null) {
            return JSON.stringify(formItem);
        }
        else {
            return `${formItem}`;
        }
    }
    createFormData(input) {
        if (input instanceof FormData) {
            return input;
        }
        return Object.keys(input || {}).reduce((formData, key) => {
            const property = input[key];
            const propertyContent = property instanceof Array ? property : [property];
            for (const formItem of propertyContent) {
                const isFileType = formItem instanceof Blob || formItem instanceof File;
                formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
            }
            return formData;
        }, new FormData());
    }
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
export class Api extends HttpClient {
    constructor() {
        super(...arguments);
        this.api = {
            /**
             * @description List ratings with optional filtering
             *
             * @tags Ratings
             * @name ListRatings
             * @summary Get a list of ratings
             * @request GET:/api/ratings
             */
            listRatings: (query, params = {}) => this.request(Object.assign({ path: `/api/ratings`, method: "GET", query: query, format: "json" }, params)),
            /**
             * @description Create or update a rating (authenticated users)
             *
             * @tags Ratings
             * @name CreateRating
             * @summary Create or update a rating for a book
             * @request POST:/api/ratings
             * @secure
             */
            createRating: (data, params = {}) => this.request(Object.assign({ path: `/api/ratings`, method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params)),
            /**
             * @description Delete a rating (owner or admin only)
             *
             * @tags Ratings
             * @name DeleteRating
             * @summary Delete a rating by ID
             * @request DELETE:/api/ratings/{id}
             * @secure
             */
            deleteRating: (id, params = {}) => this.request(Object.assign({ path: `/api/ratings/${id}`, method: "DELETE", secure: true, format: "json" }, params)),
            /**
             * @description List books with optional filtering
             *
             * @tags Books
             * @name ListBooks
             * @summary Get a list of books
             * @request GET:/api/books
             */
            listBooks: (query, params = {}) => this.request(Object.assign({ path: `/api/books`, method: "GET", query: query, format: "json" }, params)),
            /**
             * @description Create a new book (admin only)
             *
             * @tags Books
             * @name CreateBook
             * @summary Create a new book
             * @request POST:/api/books
             * @secure
             */
            createBook: (data, params = {}) => this.request(Object.assign({ path: `/api/books`, method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params)),
            /**
             * @description Get a book by ID
             *
             * @tags Books
             * @name GetBook
             * @summary Get book details by ID
             * @request GET:/api/books/{id}
             */
            getBook: (id, params = {}) => this.request(Object.assign({ path: `/api/books/${id}`, method: "GET", format: "json" }, params)),
            /**
             * @description Update a book (admin only)
             *
             * @tags Books
             * @name UpdateBook
             * @summary Update an existing book
             * @request PUT:/api/books/{id}
             * @secure
             */
            updateBook: (id, data, params = {}) => this.request(Object.assign({ path: `/api/books/${id}`, method: "PUT", body: data, secure: true, type: ContentType.Json, format: "json" }, params)),
            /**
             * @description Delete a book (admin only)
             *
             * @tags Books
             * @name DeleteBook
             * @summary Delete a book by ID
             * @request DELETE:/api/books/{id}
             * @secure
             */
            deleteBook: (id, params = {}) => this.request(Object.assign({ path: `/api/books/${id}`, method: "DELETE", secure: true, format: "json" }, params)),
            /**
             * @description List authors with optional filtering
             *
             * @tags Authors
             * @name ListAuthors
             * @summary Get a list of authors
             * @request GET:/api/authors
             */
            listAuthors: (query, params = {}) => this.request(Object.assign({ path: `/api/authors`, method: "GET", query: query, format: "json" }, params)),
            /**
             * @description Create a new author (admin only)
             *
             * @tags Authors
             * @name CreateAuthor
             * @summary Create a new author
             * @request POST:/api/authors
             * @secure
             */
            createAuthor: (data, params = {}) => this.request(Object.assign({ path: `/api/authors`, method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params)),
            /**
             * @description Get an author by ID
             *
             * @tags Authors
             * @name GetAuthor
             * @summary Get author details by ID
             * @request GET:/api/authors/{id}
             */
            getAuthor: (id, params = {}) => this.request(Object.assign({ path: `/api/authors/${id}`, method: "GET", format: "json" }, params)),
            /**
             * @description Update an author (admin only)
             *
             * @tags Authors
             * @name UpdateAuthor
             * @summary Update an existing author
             * @request PUT:/api/authors/{id}
             * @secure
             */
            updateAuthor: (id, data, params = {}) => this.request(Object.assign({ path: `/api/authors/${id}`, method: "PUT", body: data, secure: true, type: ContentType.Json, format: "json" }, params)),
            /**
             * @description Delete an author (admin only)
             *
             * @tags Authors
             * @name DeleteAuthor
             * @summary Delete an author by ID
             * @request DELETE:/api/authors/{id}
             * @secure
             */
            deleteAuthor: (id, params = {}) => this.request(Object.assign({ path: `/api/authors/${id}`, method: "DELETE", secure: true, format: "json" }, params)),
        };
    }
}
