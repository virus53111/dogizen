# MURDILIMAX: review and publish articles (free workflow)

This folder is the ONLY way the automated global editorial system can add a new story to the site.

**A JSON file with approval.status = pending does NOT appear in any public page, search index, sitemap or RSS.** AI research previews are not published either.

## Create a review PR automatically

1. Open the existing World Topic Radar issue:
   https://github.com/virus53111/dogizen/issues/150
   Open its latest successful run and read the AI draft filename in the artifact.
   Obtain the numeric run ID (from its URL) and full slug (from the draft filename).
2. Go to:
   https://github.com/virus53111/dogizen/actions/workflows/prepare-editorial-publication.yml
   Click Run workflow; enter the run ID and slug. No paid AI key needed.
3. GitHub Actions creates a DRAFT pull request with a pending JSON candidate
   in this directory. This file is deliberately not published.
4. Review and EDIT this candidate in the pull request:
   - Fact-check all statements, dates and numbers against primary sources.
   - Remove [VERIFY] placeholders and rewrite text with original value.
   - Four or more meaningful English chapters, 300+ characters each.
   - At least three useful independently verified sources on two or more hosts.
   - Confirm photo subject, real Commons image, author, file page and licence.
   - Make title, introduction, image alt text and credit genuinely accurate.
   - Translate into Russian only if independently reviewed; translations are optional.
5. Only AFTER actual human review change its approval block to:

       "approval": {
         "status": "approved",
         "reviewer": "Actual editor or reviewer",
         "checkedAt": "YYYY-MM-DD",
         "factsVerified": true,
         "originalityReviewed": true,
         "imageRightsVerified": true
       }

   Approval must have a real reviewer and date no earlier than the article date.
6. Mark the PR ready, inspect the generated site and GitHub Pages CI.
   Merge the PR after all checks pass. The main Pages workflow automatically
   builds /guides/ARTICLE-SLUG/, home/category/search entries, sitemap and RSS.

If the repository disallows GitHub Actions creating pull requests, its owner
must enable that permission in Settings > Actions > General. A repository admin
must take that action; the automation does not bypass repository policy.

There is no extra CMS, server, AI key, paid inference or mandatory subscription.

Important: automated validation can CHECK structure, URLs, approval fields and
licence metadata, but it cannot certify that the claims are true.
Never mark an AI draft independently verified without real review.
