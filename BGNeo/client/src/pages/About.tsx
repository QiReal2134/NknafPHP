import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';

const logoImg = '/logo.png';

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t('about.title')}
        description={t('about.subtitle')}
        keywords={['Nknaf', '关于', '全栈开发', 'React', 'Node.js', 'TypeScript', '开源', '技术博客']}
        url={typeof window !== 'undefined' ? `${window.location.origin}/about` : ''}
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/about` : ''}
        type="website"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Nknaf',
          jobTitle: 'Full Stack Developer',
          description: t('about.subtitle'),
          knowsAbout: ['React', 'Vue', 'Node.js', 'TypeScript', 'Python', 'MySQL', 'Docker', 'Linux'],
          url: typeof window !== 'undefined' ? `${window.location.origin}/about` : ''
        }}
      />

      <div className="about-page">
        <header className="about-header" itemScope itemType="https://schema.org/Person">
          <img src={logoImg} alt="Avatar" className="about-avatar" />
          <h1 itemProp="name">Nknaf</h1>
          <p itemProp="description">{t('about.subtitle')}</p>
        </header>

        <section className="about-section">
          <h2>{t('about.bio')}</h2>
          <p>热爱代码与创造的全栈开发者。专注于现代 Web 技术栈，喜欢折腾新框架、研究底层原理，偶尔写点东西记录成长。</p>
          <p>这里是 Nknaf 的个人技术空间 -- 分享学习笔记、项目实践与技术思考。希望这些内容能给你带来启发。</p>
        </section>

        <section className="about-section">
          <h2>{t('about.skills')}</h2>
          <div className="skill-tags">
            <span className="skill-tag">React</span>
            <span className="skill-tag">Vue</span>
            <span className="skill-tag">Node.js</span>
            <span className="skill-tag">TypeScript</span>
            <span className="skill-tag">Python</span>
            <span className="skill-tag">MySQL</span>
            <span className="skill-tag">Docker</span>
            <span className="skill-tag">Linux</span>
          </div>
        </section>

        <section className="about-section">
          <h2>{t('about.contact')}</h2>
          <p>Email: nknaf@example.com</p>
          <p>GitHub: github.com/nknaf</p>
        </section>
      </div>
    </>
  );
}
