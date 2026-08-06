package com.matchmysize.catalog.api;

import com.matchmysize.catalog.application.CatalogService;
import com.matchmysize.shared.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/bootstrap")
    ApiResponse<CatalogService.CatalogBootstrap> bootstrap() {
        return ApiResponse.success(catalogService.bootstrap());
    }
}
