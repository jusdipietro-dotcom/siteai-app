/**
 * Published-site gallery.
 *
 * `images` arrives already validated and already filtered — anything the caller
 * could not vouch for is dropped before it gets here, so this component never
 * has to decide whether a URL is safe to put in a `src`.
 */
export function GallerySection({ images }: { images: string[] }) {
  return (
    <section className="section-pad" id="galeria" style={{ background: '#f8fafc' }}>
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>Galería</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Nuestro trabajo</h2>
        <div className="gallery-grid">
          {images.map((url, i) => (
            <div key={i} className="gallery-item">
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
