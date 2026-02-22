/**
 * LibraryPages.tsx — barrel for the library feature
 * Route /library        → LibraryPage  (= LibraryHome)
 * Route /library/:id    → LibraryContentPage (= ResourceDetail)
 */
export { LibraryHome as LibraryPage } from './LibraryHome';
export { ResourceDetail as LibraryContentPage } from './ResourceDetail';
