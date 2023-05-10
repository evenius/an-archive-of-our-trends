# An Archive of our Yearning

This is a project written in NextJS for creating documentation with [Nextra](https://nextra.site).

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
[![pages-build-deployment](https://github.com/evenius/an-archive-of-our-trends/actions/workflows/pages/pages-build-deployment/badge.svg?branch=gh-pages)](https://github.com/evenius/an-archive-of-our-trends/actions/workflows/pages/pages-build-deployment)

[**Live Demo →**](https://nextra-docs-template.vercel.app)

[![](.github/screenshot.png)](https://nextra-docs-template.vercel.app)

## Quick Start

1. Clone this project

2. Make sure you have `node` and `npm` installed.

3. To simply see the website run `npm run dev`

## Running the Ao3 data script

The script is available in [script/index.ts](script/index.ts), and to run it you need to download the March 3rd, 2021 Archive of Our Own [Selective data dump for fan statisticians](https://archiveofourown.org/admin_posts/18804).
Unzip the files and name them `tags.csv` and `works.csv` in the root of this project.

After this, run `npm run generate`. This will generate all new data files (based on old data) into `public/data`.

If you have any concerns or ideas for improvements feel free to open an issue, or submit a Pull Request :)

## License

This project is licensed under the MIT License.
