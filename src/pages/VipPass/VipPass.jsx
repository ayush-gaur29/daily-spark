import React, { useState } from 'react';
import { useSparks } from '../../context/SparksContext';
import { VIP_VIDEOS } from '../../data/videos';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import './VipPass.css';

export const VipPass = ({ onNavigateToSpark }) => {
  const { showToast } = useSparks();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [isUpgraded, setIsUpgraded] = useState(false);
  const [activeVipVideo, setActiveVipVideo] = useState(null);

  const handleStartTrial = () => {
    setIsUpgraded(true);
    showToast('14-day free trial activated. Welcome to VIP Mentorship Pass!');
  };

  const closeVideoModal = () => {
    setActiveVipVideo(null);
  };

  const privileges = [
    {
      id: 'archive',
      title: 'Full Audio Archive',
      desc: 'Every past Spark and masterclass without expiration.',
      icon: 'headphones'
    },
    {
      id: 'offline',
      title: 'Offline Mode',
      desc: 'Seamless downloads for flights, commutes, and morning retreats.',
      icon: 'cloud_download'
    },
    {
      id: 'qa',
      title: 'Monthly Live Q&A',
      desc: 'Direct quarterly virtual sessions with Dr. Cubie.',
      icon: 'forum'
    },
    {
      id: 'workbooks',
      title: 'Extended Reflection Workbooks',
      desc: 'Printable guides for executive journaling and intent setting.',
      icon: 'menu_book'
    }
  ];

  return (
    <div className="vip-screen animate-fade-in">
      {/* 1. Membership Status Pill Bar */}
      <section className="vip-tier-banner" aria-label="Current Tier">
        <div className="vip-tier-left">
          <span className="vip-tier-dot" />
          <span className="vip-tier-status font-label-sm">
            {isUpgraded ? 'CURRENT TIER: VIP ANNUAL PASS' : 'CURRENT TIER: FREE GUEST'}
          </span>
        </div>
        <button
          className="vip-upgrade-link font-label-sm"
          onClick={() => {
            const planSec = document.getElementById('select-membership-section');
            planSec?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {isUpgraded ? 'Manage Subscription' : 'Upgrade Anytime'}
        </button>
      </section>

      {/* 2. Editorial VIP Hero Card */}
      <section className="vip-hero-card" aria-label="VIP Hero">
        <div className="vip-hero-ambient" />
        <div className="vip-hero-top-row">
          <span className="vip-hero-badge font-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span>VIP Mentorship Pass</span>
          </span>
          <span className="vip-cohort-tag font-label-sm">
            Annual Cohort
          </span>
        </div>

        <div className="vip-hero-heading-group">
          <h1 className="vip-hero-title font-headline-xl-mobile">
            Elevate Your Daily Practice
          </h1>
          <p className="vip-hero-subtitle font-body-md">
            Unrestricted access to Dr. Cubie's private audio archives, exclusive video masterclasses, and offline library.
          </p>
        </div>

        {/* Gallery Image with Accent Badge */}
        <div className="vip-hero-media">
          <ImageWithFallback
            src="/assets/images/vip-pass-card.jpg"
            fallbackSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuC0iXAYxTgJuwmfRSDFtz60HNFaddZz7VPbasYhfaA__ylEcq7YSisOxTzwwRcTEpmAFE7oC0Y9iGaavseRnOqfrbqAjxYC7rUih2NRPTdFPOit9bcbDKHDEze2lejgky_M7zzXz8yxzKvZveJszaJ3X3nHVTLconN-rlgJIAwEX2oN2YbQixbm98RIDcLZ-Fy104o7LoLNv8WaBk64mrxP9ZXa9zUIFAbEc-e2BBGksD_ygIHKajMRwg"
            type="spark"
            alt="VIP Private Gallery"
            className="vip-hero-img"
          />
          <div className="vip-hero-gradient-overlay" />
          <div className="vip-hero-counter-badge font-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              smart_display
            </span>
            <span>320+ Curated Sparks & Video Guides</span>
          </div>
        </div>
      </section>

      {/* 3. Included Privileges */}
      <section className="vip-privileges-section" aria-label="Included Privileges">
        <div className="vip-privileges-header">
          <span className="vip-privileges-label font-label-sm">
            Included Privileges
          </span>
          <span className="vip-all-inclusive font-label-sm">
            All-Inclusive
          </span>
        </div>

        <div className="vip-privileges-list">
          {privileges.map((p) => (
            <div key={p.id} className="vip-privilege-item">
              <div className="vip-privilege-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                  {p.icon}
                </span>
              </div>
              <div className="vip-privilege-content">
                <h3 className="vip-privilege-title font-title-md">
                  {p.title}
                </h3>
                <p className="vip-privilege-desc font-body-md">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. VIP Video Library (Curated, Minimal, Premium) */}
      <section className="vip-video-library-section" aria-label="VIP Video Library">
        <div className="vip-video-library-header">
          <div className="vip-video-header-left">
            <span className="vip-video-header-badge font-label-sm">
              EXCLUSIVE SESSIONS
            </span>
            <h2 className="vip-video-header-title font-headline-md">
              VIP Video Library
            </h2>
          </div>
          <span className="vip-video-count-pill font-label-sm">
            3 SESSIONS
          </span>
        </div>

        <div className="vip-video-cards-list">
          {VIP_VIDEOS.map((video) => (
            <article
              key={video.id}
              className="vip-video-card btn-pressable"
              onClick={() => setActiveVipVideo(video)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveVipVideo(video)}
              aria-label={`Play VIP session: ${video.title}`}
            >
              <div className="vip-video-thumb-wrap">
                <ImageWithFallback
                  src={video.posterUrl}
                  type="video"
                  alt={video.title}
                  className="vip-video-thumb-img"
                />
                <div className="vip-video-play-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                </div>
                <span className="vip-video-duration-pill font-label-sm">
                  {video.duration}
                </span>
              </div>

              <div className="vip-video-card-content">
                <div className="vip-video-card-top">
                  <span className="vip-video-category font-label-sm">
                    {video.categoryLabel}
                  </span>
                  <span className="vip-video-vip-label font-label-sm">
                    VIP EXCLUSIVE
                  </span>
                </div>
                <h3 className="vip-video-card-title font-title-md">
                  {video.title}
                </h3>
                <p className="vip-video-card-desc font-body-sm">
                  {video.subtitle}
                </p>
              </div>

              <div className="vip-video-card-action">
                <span className="material-symbols-outlined vip-video-arrow">
                  chevron_right
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Select Membership */}
      <section className="vip-select-membership" id="select-membership-section" aria-label="Select Membership">
        <div className="vip-select-header">
          <span className="vip-select-label font-label-sm">
            Select Membership
          </span>
          <span className="vip-billing-note font-label-sm">
            Billed via App Store
          </span>
        </div>

        <div className="vip-pricing-options">
          {/* Annual Card */}
          <div
            className={`vip-pricing-card ${selectedPlan === 'annual' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('annual')}
            role="radio"
            aria-checked={selectedPlan === 'annual'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedPlan('annual')}
          >
            <div className="vip-radio-icon">
              {selectedPlan === 'annual' ? (
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              ) : (
                <span className="material-symbols-outlined text-outline" style={{ fontSize: '22px' }}>
                  radio_button_unchecked
                </span>
              )}
            </div>

            <div className="vip-pricing-details">
              <div className="vip-pricing-title-row">
                <span className="vip-pricing-name font-title-md">
                  Annual Membership
                </span>
                <span className="vip-save-badge font-label-sm">
                  SAVE 30%
                </span>
              </div>
              <p className="vip-pricing-price font-body-md">
                $99/year ($8.25/mo) • 14 days free
              </p>
            </div>
          </div>

          {/* Monthly Card */}
          <div
            className={`vip-pricing-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
            role="radio"
            aria-checked={selectedPlan === 'monthly'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedPlan('monthly')}
          >
            <div className="vip-radio-icon">
              {selectedPlan === 'monthly' ? (
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              ) : (
                <span className="material-symbols-outlined text-outline" style={{ fontSize: '22px' }}>
                  radio_button_unchecked
                </span>
              )}
            </div>

            <div className="vip-pricing-details">
              <div className="vip-pricing-title-row">
                <span className="vip-pricing-name font-title-md">
                  Monthly Membership
                </span>
              </div>
              <p className="vip-pricing-price font-body-md">
                $11.99/month • Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="vip-cta-wrap">
          <button
            className="vip-start-trial-btn btn-pressable"
            onClick={handleStartTrial}
          >
            {isUpgraded ? 'Your VIP Membership is Active' : 'Start 14-Day Free Trial'}
          </button>
          <p className="vip-cta-disclaimer font-body-sm">
            No commitment. Cancel anytime in your profile settings.
          </p>
        </div>
      </section>

      {/* 6. VIP Video Playback Modal */}
      {activeVipVideo && (
        <div className="vip-video-modal-backdrop animate-fade-in" onClick={closeVideoModal}>
          <div
            className="vip-video-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeVipVideo.title} VIP Video Session`}
          >
            <div className="vip-video-modal-header">
              <div className="vip-video-modal-badge font-label-sm">
                VIP SESSION • {activeVipVideo.categoryLabel}
              </div>
              <button
                className="vip-video-modal-close-btn btn-pressable"
                onClick={closeVideoModal}
                aria-label="Close VIP video player"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="vip-video-modal-player-viewport">
              <VideoPlayer
                src={activeVipVideo.videoUrl}
                poster={activeVipVideo.posterUrl}
                title={activeVipVideo.title}
                durationLabel={activeVipVideo.duration}
                variant="hero"
              />
            </div>

            <div className="vip-video-modal-body">
              <h3 className="vip-video-modal-title font-headline-md">
                {activeVipVideo.title}
              </h3>
              <p className="vip-video-modal-subtitle font-body-md">
                {activeVipVideo.subtitle}
              </p>
              <div className="vip-video-modal-meta font-label-sm">
                <span>Duration: {activeVipVideo.duration}</span>
                <span>•</span>
                <span>Instructor: Dr. Cubie</span>
                <span>•</span>
                <span>VIP Masterclass</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
