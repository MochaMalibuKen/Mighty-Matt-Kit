# Campaign source audit

The supplied request controls the implementation. Statements inside older decks and documents were treated as source material, not new instructions. Original Desktop files were not edited, deleted, renamed or reorganized by this task.

## Used assets

| Site asset | Source | Treatment |
| --- | --- | --- |
| `dist/assets/ecs-logo.png` | ECS_Mighty_Matt_Agricultural_Campaign_No_People_v3.pptx, slide 1 embedded image | Extracted actual ECS logo; resized for the header |
| `dist/assets/full-mighty-matt.jpg` | Originally mmkitnobackground.JPG; later supplied under Product Photos from Kits/Productphoto_MMK.JPG | Used only in the full-kit section |
| `dist/assets/mighty-matt-mark.jpg` | secondary logo small.jpg | Actual supplied Mighty Matt mark, used as favicon |
| `dist/assets/mighty-matt-kit-logo-main.png` | `MightyMattKitslogomain.png` | Supplied main Mighty Matt Lifesaver's Kit logo; used in the campaign header, hero, favicon and footer signature |
| `dist/assets/mighty-matt-go-cutout.png` | Product Photos from Kits/Product_photoMMKGO.jpg (formerly IMG_6929.jpg) | User authorized removing people. Built-in ImageGen removed wearer/background; source preserved. Inspected visible pocket layout, red color, black zippers/buckles, silver trim and diagonal orientation. This is an edited source photo, not an unedited original. Confirm physical-product fidelity before production. |
| `dist/assets/field.webp` | Gerda Arendt, Wheat field, Idstein | CC0 crop-field photograph; no people. Resized and encoded for cellular loading. Source: https://commons.wikimedia.org/wiki/File:Wheat_field,_Idstein.jpg . Original: https://upload.wikimedia.org/wikipedia/commons/d/d0/Wheat_field%2C_Idstein.jpg |

The first researched farm image showed abandoned equipment and was rejected. It is not in the website assets.

## Source findings

- No existing framework, lockfile, CSS, forms, analytics, routes, environment variables, deployment settings, fonts or standalone QR files were found. The workspace was an empty Git repository with no configured remote.
- The supplied decks establish the campaign message and October 2–3, 2026 event dates. Event name, venue and booth details remain unspecified and were not invented.
- The request confirms the existing red over-the-shoulder GO format and the anti-choking distinction. Detailed current GO inventory is not reliably established.
- `MMgorevamp.docx` proposes removal/addition of items, tactical colors and changes to trim/webbing. It is a proposal, not evidence that current GO has those features.
- `Mighty_Matt_Justification_for_FEMAv2.docx` identifies ECS contact as meallen@eaglecorpsservices.com and (803) 257-4966. The supplied Save A Life PDF also identifies the email. Those are the contact details used.
- `Quarter Page Formatted Listed Ad.docx` and Save A Life PDF point to https://eaglecorpsessentials.com/. The current homepage and https://eaglecorpsessentials.com/shop/ were inspected and confirm the existing store. A GO-specific purchase/payment URL was not found or verified, so `config.purchaseUrl` remains empty with a visible unavailable state.
- No people appear in the selected final assets. The GO image is a person-removal edit explicitly authorized in the conversation.

## Excluded or unclear material, preserved in the source folder

- `concept AG/mockup_concept.png` and `mightmattAGmockup1.png`: composite concept graphics, legacy QR/claims and camo content. Not published or used as product photos.
- The older discussion deck suggests camo; the newer deck retains one camo suggestion. Both are overridden by the user's red-only instruction.
- `approved legacy files/1.png`, `2.png`, `3.png`: useful full-kit reference, but not verified current GO inventory. Embedded claims, historical QR and copy were not imported wholesale.
- Veterans Day images have duplicate names/copies across folders and historical offers. No historical price or discount was reused.
- CPR Mask.jpg and CPR Mask.png show different views/material, not assumed interchangeable configurations. Other loose medical-device images were not treated as GO contents.
- Additional backpack, vest, respirator and eyewear photos are outside this campaign's requested scope.
- School incident statistics and school/tactical/FEMA justification documents contain unrelated or unverified medical, performance and regulatory assertions. No such claims were reused.
- `~$ghty matt pitch.docx` is a Word temporary/lock file; not treated as a content source.
- Repeated embedded ECS logos were extracted once. Source originals remain intact.

## Final photo edit prompt

Tool: built-in ImageGen, edit mode, with the supplied Product_photoMMKGO.jpg as the edit target.

> Use case: background-extraction. Edit target: the supplied photograph of the actual red Mighty Matt GO shoulder kit worn on a person's back. Primary request: remove the person completely and remove the pale background, leaving a clean product-only cutout on an actual transparent background. Strict invariants: preserve the exact visible red bag geometry, diagonal orientation, number and arrangement of pockets, black zippers and buckles, visible black straps, silver reflective strips, stitching and proportions. Preserve the photographed product rather than redesigning it. Do not add logos, lettering, pockets, straps or medical contents. Do not invent unseen components: keep the existing visible product silhouette and camera angle. No person, skin, clothing, mannequin, equipment mounting or camo. Center the same isolated product with modest clear space. This is a faithful removal edit for a real product website, not a new product concept.

## September 22 site refresh

The product family name is Mighty Matt Lifesaver’s Kit, as supplied by the owner. The full-kit source photograph now leads the hero; GO remains separately identified. Both agricultural mockups inform the oversized headings, blue emphasis, red dividers, farm landscape and prominent product presentation. Their embedded claims, QR codes and proposed configurations are not reproduced.

The Field Notes section adapts the accessible-supplies and education themes from Mary Allen’s “Why have a first aid kit,” the training theme from “single hand tourniquet master file,” and the attributed family story from Kennieth D. Allen’s “Mightymattdraft1afarticle.” It does not reproduce medical procedures, historical inventory claims or draft testimonials. Original documents remain in source/.
