package com.matchmysize.seller.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import com.matchmysize.identity.infrastructure.AppUserRepository;
import com.matchmysize.identity.infrastructure.AppUserRepository.AppUser;
import com.matchmysize.seller.infrastructure.SellerRepository;
import com.matchmysize.seller.infrastructure.SellerRepository.CatalogRow;
import com.matchmysize.seller.infrastructure.SellerRepository.PersistedSize;
import com.matchmysize.shared.api.ApiException;
import com.matchmysize.shared.config.JsonMaps;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SellerServiceTest {
    @Mock private SellerRepository repository;
    @Mock private AppUserRepository users;
    @Mock private JsonMaps jsonMaps;
    @InjectMocks private SellerService service;

    @Test
    void normalizesSellerMeasurementsToCentimetresBeforePersisting() {
        var seller = seller();
        var chartId = new AtomicReference<UUID>();
        when(users.findById(seller.id())).thenReturn(Optional.of(seller));
        when(jsonMaps.asMap(any())).thenAnswer(invocation -> invocation.getArgument(0));
        org.mockito.Mockito.doAnswer(invocation -> {
            chartId.set(invocation.getArgument(1, PersistedSize.class).chartId());
            return null;
        }).when(repository).insertSize(eq(seller.id()), any(PersistedSize.class));
        when(repository.findActiveCatalog(seller.id())).thenAnswer(invocation -> List.of(new CatalogRow(
            chartId.get(), "seller-size", "Test Brand", "Test Brand", "Men", "Men", "shirt", null,
            "M", BigDecimal.ONE, "cm", new BigDecimal("41.91"), Map.of(
                "measurementKeys", List.of("neck", "chest", "sleeve", "shoulder"),
                "primaryMeasurementKeys", List.of("neck"),
                "measurementBasis", "BODY",
                "measurements", Map.of("neck", new BigDecimal("41.91"))
            )
        )));

        service.createCategory(seller, new SellerService.SaveChartCommand(
            "MEN", "shirt", null, "in", "BODY",
            List.of(new SellerService.SizeInput(null, "M", BigDecimal.ONE, Map.of("neck", "16.5")))
        ));

        var captured = ArgumentCaptor.forClass(PersistedSize.class);
        verify(repository).insertSize(eq(seller.id()), captured.capture());
        var storedMeasurements = (Map<?, ?>) captured.getValue().rawData().get("measurements");
        assertThat(storedMeasurements.get("neck")).isEqualTo(new BigDecimal("41.91"));
        assertThat(captured.getValue().rawData().get("unit")).isEqualTo("cm");
    }

    @Test
    void rejectsCustomerAccessToSellerData() {
        var customer = new AppUser(9L, UUID.randomUUID(), null, null, "+94770000000", "customer", "active", Map.of());
        assertThatThrownBy(() -> service.dashboard(customer))
            .isInstanceOf(ApiException.class)
            .hasMessage("Seller access is required.");
    }

    @Test
    void normalizesSellerPublicLinksBeforeSavingProfile() {
        var seller = seller();
        when(jsonMaps.copy(seller.profileData())).thenReturn(new LinkedHashMap<>(seller.profileData()));
        when(users.updateSellerProfile(eq(seller.id()), any())).thenAnswer(invocation -> new AppUser(
            seller.id(), seller.authUserId(), seller.sourceAccountId(), seller.authEmail(), seller.phoneNumber(),
            seller.role(), seller.status(), invocation.getArgument(1)
        ));

        var updated = service.updateProfile(seller, Map.of(
            "businessName", "Test Brand",
            "contactName", "Seller",
            "email", "seller@example.com",
            "phoneNumber", "+94771234567",
            "address", "Colombo",
            "photoUrl", "",
            "websiteUrl", "testbrand.example/shop",
            "instagramUrl", "https://instagram.com/testbrand",
            "facebookUrl", "",
            "tiktokUrl", ""
        ));

        assertThat(updated.websiteUrl()).isEqualTo("https://testbrand.example/shop");
        assertThat(updated.instagramUrl()).isEqualTo("https://instagram.com/testbrand");
    }

    @Test
    void rejectsNonHttpSellerPublicLinks() {
        var seller = seller();
        when(jsonMaps.copy(seller.profileData())).thenReturn(new LinkedHashMap<>(seller.profileData()));

        assertThatThrownBy(() -> service.updateProfile(seller, Map.of(
            "businessName", "Test Brand",
            "contactName", "Seller",
            "websiteUrl", "javascript:alert(1)"
        )))
            .isInstanceOf(ApiException.class)
            .hasMessage("Website must be a valid website link.");
    }

    private AppUser seller() {
        return new AppUser(
            7L,
            UUID.randomUUID(),
            "legacy-seller-id",
            "seller@example.com",
            "+94771234567",
            "seller",
            "active",
            Map.of("businessName", "Test Brand", "contactName", "Seller")
        );
    }
}
