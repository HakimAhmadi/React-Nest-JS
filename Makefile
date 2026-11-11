.PHONY: help install install-backend install-frontend install-mobile env.set setup seed db-check db-plan db-verify db-release backup-create backup-verify backup-restore-check check run-backend run-frontend run-mobile

help:
	@echo "make install        Install locked backend, frontend, and mobile dependencies"
	@echo "make env.set        Complete local env files without replacing credentials"
	@echo "make setup          Initialize database, seed development data, build backend"
	@echo "make seed           Rerun development seeds without overwriting accounts"
	@echo "make db-check       Check the configured database schema and row counts"
	@echo "make db-plan        Read pending and applied migration names"
	@echo "make db-verify      Check migration history and entity schema without writes"
	@echo "make db-release     Apply reviewed migrations and verify the resulting schema"
	@echo "make backup-create ARGS=...       Create an encrypted database/upload backup"
	@echo "make backup-verify ARGS=...       Authenticate the complete backup bundle"
	@echo "make backup-restore-check ARGS=... Restore, compare and remove an isolated clone"
	@echo "make check          Build both applications and check API contracts"
	@echo "make run-backend    Start the NestJS development API"
	@echo "make run-frontend   Start the Vite React development server"
	@echo "make run-mobile     Start the Expo mobile app development server"
	@echo "make mail-status    Inspect provider configuration without connecting or sending"
	@echo "make mail-capture   Verify local email flows using a disposable database and capture files"
	@echo "make mail-retention ARGS=...  Preview eligible queue metadata; never deletes records"

install: install-backend install-frontend install-mobile

install-backend:
	npm --prefix backend ci

install-frontend:
	npm --prefix frontend ci

install-mobile:
	npm --prefix mobile-app install

env.set:
	npm --prefix backend run env:setup

setup:
	npm --prefix backend run setup

seed:
	npm --prefix backend run seed

db-check:
	npm --prefix backend run db:check

db-plan:
	npm --prefix backend run db:plan

db-verify:
	npm --prefix backend run db:verify

db-release:
	npm --prefix backend run db:release

backup-create:
	npm --prefix backend run backup:create -- $(ARGS)

backup-verify:
	npm --prefix backend run backup:verify -- $(ARGS)

backup-restore-check:
	npm --prefix backend run backup:restore-check -- $(ARGS)

check:
	npm --prefix backend run build
	npm --prefix backend run check:contracts
	npm --prefix frontend run check:contracts
	npm --prefix frontend run build

run-backend:
	npm --prefix backend run start:dev

run-frontend:
	npm --prefix frontend run dev

run-mobile:
	npm --prefix mobile-app run start

.PHONY: mail-status mail-capture mail-retention
mail-status:
	npm --prefix backend run mail:status

mail-capture:
	npm --prefix backend run mail:capture-demo -- $(ARGS)

mail-retention:
	npm --prefix backend run mail:retention-plan -- $(ARGS)

.PHONY: ops-check ops-monitor security-scan proxy-smoke
ops-check:
	npm --prefix backend run ops:check

ops-monitor:
	npm --prefix backend run ops:monitor

security-scan:
	node scripts/security-scan.cjs

proxy-smoke:
	node scripts/proxy-smoke.cjs

.PHONY: validate-browsers validate-capacity validate-performance
validate-browsers:
	npm run validate:browsers

validate-capacity:
	npm run validate:capacity

validate-performance:
	npm run validate:performance
