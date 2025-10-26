.DEFAULT_GOAL := help

WEB_DIR := web
SCRIPTS_DIR := scripts
ARCGIS_DELBYDELER := https://services-eu1.arcgis.com/Hky23fkHucfDZYMu/arcgis/rest/services/Delbydeler/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson

.PHONY: help install data data-delbydeler data-kommuner data-fylker data-world dev build start lint clean ci test e2e

help: ## Show this help
	@echo "Available targets:" ; \
	awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_\-]+:.*## / { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies for web and scripts
	@npm ci --prefix $(WEB_DIR) || npm install --prefix $(WEB_DIR)
	@npm ci --prefix $(SCRIPTS_DIR) || npm install --prefix $(SCRIPTS_DIR)

data: ## Generate normalized and simplified GeoJSON (optional: DATA_URL=...)
	@DATA_URL="$(DATA_URL)" npm run fetch:oslo --prefix $(SCRIPTS_DIR)

data-delbydeler: ## Fetch Oslo delbydeler from ArcGIS and generate outputs
	@DATA_URL="$(ARCGIS_DELBYDELER)" npm run fetch:oslo --prefix $(SCRIPTS_DIR)

data-kommuner: ## Process Norwegian municipalities GeoJSON
	@npm run fetch:kommuner --prefix $(SCRIPTS_DIR)

data-fylker: ## Process Norwegian counties GeoJSON
	@npm run fetch:fylker --prefix $(SCRIPTS_DIR)

data-world: ## Process world countries GeoJSON
	@npm run process:world --prefix $(SCRIPTS_DIR)

data-europe: ## Process Europe countries GeoJSON
	@npm run process:europe --prefix $(SCRIPTS_DIR)

dev: ## Run Next.js dev server
	@npm run dev --prefix $(WEB_DIR)

build: ## Build the web app
	@npm run build --prefix $(WEB_DIR)

start: ## Start the production server
	@npm run start --prefix $(WEB_DIR)

lint: ## Run linter
	@npm run lint --prefix $(WEB_DIR)

clean: ## Remove build artifacts and generated data
	@rm -rf $(WEB_DIR)/.next
	@rm -f $(WEB_DIR)/public/data/bydeler.geo.json $(WEB_DIR)/public/data/bydeler_simplified.geo.json
	@rm -f $(WEB_DIR)/public/data/kommuner.geo.json $(WEB_DIR)/public/data/kommuner_simplified.geo.json
	@rm -f $(WEB_DIR)/public/data/fylker.geo.json $(WEB_DIR)/public/data/fylker_simplified.geo.json
	@rm -f $(WEB_DIR)/public/data/world.geo.json $(WEB_DIR)/public/data/world_simplified.geo.json
	@rm -f $(WEB_DIR)/public/data/europe.geo.json $(WEB_DIR)/public/data/europe_simplified.geo.json

ci: ## Run CI steps (install, data, lint, build)
	@$(MAKE) install
	@$(MAKE) data
	@$(MAKE) data-kommuner
	@$(MAKE) data-fylker
	@$(MAKE) data-world
	@$(MAKE) lint
	@$(MAKE) build

test: ## Run unit tests (if configured)
	@-npm run test --prefix $(WEB_DIR)

e2e: ## Run e2e tests (if configured)
	@-npm run e2e --prefix $(WEB_DIR)
