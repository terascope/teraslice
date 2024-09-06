import Layout from "@theme/Layout";
import React from "react";

const HomeSplash = props => {
    const { siteConfig, language = '' } = props;
    const { baseUrl, customFields } = siteConfig;
    const { docsUrl } = customFields;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
        <div className="homeContainer">
            <div className="homeSplashFade">
                <div className="wrapper homeWrapper">{props.children}</div>
            </div>
        </div>
    );

    const Logo = props => (
        <div className="projectLogo">
            <img src={props.img_src} alt="Project Logo" />
        </div>
    );

    const ProjectTitle = () => (
        <h2 className="projectTitle">
            {siteConfig.title}
            <small>{siteConfig.tagline}</small>
        </h2>
    );

    const PromoSection = props => (
        <div className="section promoSection">
            <div className="promoRow">
                <div className="pluginRowBlock">{props.children}</div>
            </div>
        </div>
    );

    const Button = props => (
        <div className="pluginWrapper buttonWrapper">
            <a className="button" href={props.href} target={props.target}>
                {props.children}
            </a>
        </div>
    );

    return (
        <SplashContainer>
            <Logo img_src={`${baseUrl}img/logo.png`} />
            <div className="inner">
                <ProjectTitle siteConfig={siteConfig} />
                <PromoSection>
                    <Button href={docUrl('overview.html')}>Overview</Button>
                    <Button href={docUrl('getting-started.html')}>Getting Started</Button>
                    <Button href={docUrl('development/overview.html')}>Development</Button>
                </PromoSection>
            </div>
        </SplashContainer>
    );
}

const Index = props => {
    const { config: siteConfig, language = '' } = props;
    return (
        <Layout
            title="Home"
            description={siteConfig.tagline}>
            <main>
                <div padding={['bottom', 'top']} id="description" background="light">
                    <HomeSplash siteConfig={siteConfig} language={language} />
                </div>
            </main>
        </Layout>
    );
}

export default Index;
