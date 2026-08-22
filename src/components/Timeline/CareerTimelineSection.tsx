import { careerMilestones } from '../../data/kohliData';
import { useIntersectionObserver } from '../../hooks';
import './CareerTimelineSection.css';

export default function CareerTimelineSection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.1);

  return (
    <section id="career-timeline" className="timeline-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="timeline-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <p className="section-label">CRICKET JOURNEY ARC</p>
          <h2 className="section-title">
            CAREER <span className="text-gold">TIMELINE</span>
          </h2>
          <p className="section-body">
            A chronological narrative through the pivotal cricket milestones that defined Virat Kohli's legacy — struggle, rise, peak, setback, redemption, and his current chapter.
          </p>
        </div>

        {/* Vertical Timeline Tree */}
        <div className="vertical-timeline-wrapper">
          <div className="timeline-spine-line" aria-hidden="true" />

          <div className="timeline-nodes-list">
            {careerMilestones.map((item, i) => {
              const isEven = i % 2 === 0;
              return (
                <div
                  key={item.year}
                  className={`timeline-node-item ${isEven ? 'node-left' : 'node-right'} ${isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Central Node Indicator */}
                  <div className="node-center-pin">
                    <span className="node-dot" />
                    <span className="node-year-tag">{item.year}</span>
                  </div>

                  {/* Milestone Card */}
                  <div className="node-card glass-card">
                    <div className="node-card-top">
                      <span className="node-phase">{item.phase}</span>
                      {item.badge && <span className="node-badge">{item.badge}</span>}
                    </div>
                    <h3 className="node-card-title">{item.title}</h3>
                    <p className="node-card-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
