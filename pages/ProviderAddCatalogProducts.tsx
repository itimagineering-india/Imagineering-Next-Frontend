"use client";

import { CatalogProductsPage } from "@/components/services/catalog/CatalogProductsPage";

export async function getServerSideProps() {
  return { props: {} };
}

export default function ProviderAddCatalogProducts() {
  return <CatalogProductsPage mode="add" />;
}
