# Speaker Windows

[![API Tests](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/api-tests.yml/badge.svg)](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/api-tests.yml) [![Latest Version Deployed](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/build-and-deploy.yml/badge.svg)](https://github.com/andrewwippler/SpeakerWindows/actions/workflows/build-and-deploy.yml)

A complete rewrite of [Speaker-Illustrations](https://github.com/andrewwippler/speaker-illustrations). You have permission to use my [http://sw.wplr.rocks/](personal installation) or install this software on your own infrastructure. Dockerfiles are included in the respective folders.

Speaker Windows is a personal, searchable repository of illustrations which are categorized by tags. This is a replacement to paper, word doc folder, and evernote/onenote notebook filing systems.

The project aims to have an testable API which allows the use of multiuser authentication, sharing of illustrations, and React UI to easily add illustrations.

## Development

Need 3 terminals open to run:
1. `docker-compose up`
2. `cd api && yarn dev`
3. `cd frontend && yarn dev`

## Migrating from Speaker-Illustrations

1. Clone this repository
2. Place Speaker-Illustrations-backup.sql inside `./tmp/seeds`
3. run `docker-compose up`
4. run `cd api && node ace migration:run`

## Project Timeline

Version 0.1.0

- ~~Imported schema from Speaker-Illustrations~~
- ~~Migration guide~~
- ~~CI/CD (GitHub Actions?)~~

Version 0.2.0

- ~~API tests~~
- ~~Set up models and controllers~~

Version 0.3.0

- ~~Multiuser Auth~~

Version 0.4.0

- ~~Basic UI~~

Version 0.5.0

- User Preferences (password, API key)

Version 0.6.0
- Image uploads

Version 0.7.0

- Sharing roles (Owner, Creator, Editor, Read-Only)
- Sharing ID

Version 1.0

- Bug fixes

## License

Apache 2.0
