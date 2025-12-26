"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = require("fs");
var path = require("path");
var prisma = new client_1.PrismaClient();
// Configuration
var SCRAPER_DATA_DIR = path.join(__dirname, '../../scraper/data');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var dbUrl, files, processedCount, errorCount, _loop_1, _i, files_1, file;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🚀 Starting sync from scraped data to database...');
                    dbUrl = process.env.DATABASE_URL;
                    if (!dbUrl) {
                        console.error('❌ DATABASE_URL is missing in environment variables!');
                        process.exit(1);
                    }
                    // console.log(`🔌 Database URL loaded: ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);
                    if (!fs.existsSync(SCRAPER_DATA_DIR)) {
                        console.error("\u274C Scraper data directory not found at: ".concat(SCRAPER_DATA_DIR));
                        process.exit(1);
                    }
                    files = fs.readdirSync(SCRAPER_DATA_DIR).filter(function (f) { return f.endsWith('.json'); });
                    console.log("Found ".concat(files.length, " JSON files to process."));
                    processedCount = 0;
                    errorCount = 0;
                    _loop_1 = function (file) {
                        var filePath, fileContent, data, brand, model_1, variantsData, err_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    filePath = path.join(SCRAPER_DATA_DIR, file);
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 7, , 8]);
                                    fileContent = fs.readFileSync(filePath, 'utf-8');
                                    data = JSON.parse(fileContent);
                                    return [4 /*yield*/, prisma.brand.upsert({
                                            where: { slug: data.brand_slug },
                                            update: {
                                                name: data.brand_name,
                                                // Optional: Update logos if available in JSON, else keep existing
                                            },
                                            create: {
                                                name: data.brand_name,
                                                slug: data.brand_slug,
                                            },
                                        })];
                                case 2:
                                    brand = _c.sent();
                                    return [4 /*yield*/, prisma.model.upsert({
                                            where: {
                                                brandId_slug: {
                                                    brandId: brand.id,
                                                    slug: data.model_slug
                                                }
                                            },
                                            update: {
                                                name: data.model_name,
                                                type: data.type,
                                            },
                                            create: {
                                                name: data.model_name,
                                                slug: data.model_slug,
                                                type: data.type,
                                                brandId: brand.id,
                                            }
                                        })];
                                case 3:
                                    model_1 = _c.sent();
                                    // 3. Sync Variants
                                    // Strategy: Clear existing variants for this model and re-insert.
                                    // This ensures we don't have stale variants (e.g. if a name changed or was removed).
                                    // This mirrors the reliable logic in seed.ts.
                                    return [4 /*yield*/, prisma.variant.deleteMany({
                                            where: { modelId: model_1.id }
                                        })];
                                case 4:
                                    // 3. Sync Variants
                                    // Strategy: Clear existing variants for this model and re-insert.
                                    // This ensures we don't have stale variants (e.g. if a name changed or was removed).
                                    // This mirrors the reliable logic in seed.ts.
                                    _c.sent();
                                    if (!(data.variants && Array.isArray(data.variants))) return [3 /*break*/, 6];
                                    variantsData = data.variants.map(function (v) { return ({
                                        name: v.name,
                                        priceExShowroom: v.priceExShowroom || 0,
                                        fuelType: v.fuelType || 'Unknown',
                                        transmission: v.transmission || 'Unknown',
                                        specs: v.specs || {},
                                        colors: v.colors || [],
                                        modelId: model_1.id
                                    }); });
                                    if (!(variantsData.length > 0)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, prisma.variant.createMany({
                                            data: variantsData
                                        })];
                                case 5:
                                    _c.sent();
                                    _c.label = 6;
                                case 6:
                                    console.log("\u2705 Synced: ".concat(data.model_name, " (").concat(((_a = data.variants) === null || _a === void 0 ? void 0 : _a.length) || 0, " variants)"));
                                    processedCount++;
                                    return [3 /*break*/, 8];
                                case 7:
                                    err_1 = _c.sent();
                                    console.error("\u274C Error processing ".concat(file, ":"), err_1);
                                    errorCount++;
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, files_1 = files;
                    _b.label = 1;
                case 1:
                    if (!(_i < files_1.length)) return [3 /*break*/, 4];
                    file = files_1[_i];
                    return [5 /*yield**/, _loop_1(file)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("\n\uD83C\uDF89 Sync Complete!");
                    console.log("Processed Models: ".concat(processedCount));
                    console.log("Errors: ".concat(errorCount));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
