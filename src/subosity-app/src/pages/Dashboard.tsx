import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Button, Collapse, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faHandHoldingDollar,
  faCreditCard,
  faCalendarAlt,
  faRotate,
  faHand,
  faMoneyBillWave,
  faCheckSquare,
  faFilter,
  faClock,
  faCheckCircle,
  faBan,
  faTimesCircle,
  faPause,
  faRotateLeft,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getOccurrencesCountInRange } from '../utils/recurrenceUtils';
import Select from 'react-select';
import { selectStyles } from '../styles/selectStyles';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Remove requireAuth since we use ProtectedRoute
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalMonthly: 0,
    totalYearly: 0,
    totalDaily: 0,
    autoRenewalCount: 0,
    categoryData: { labels: [], values: [] },
    paymentData: { labels: [], values: [] },
    stateDistribution: {}
  });

  const [showFilters, setShowFilters] = useState(false);
  const [excludedStates, setExcludedStates] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  const stateFilterOptions = [
    { value: 'trial', label: 'Trial', icon: faClock },
    { value: 'active', label: 'Active', icon: faCheckCircle },
    { value: 'canceled', label: 'Canceled', icon: faBan },
    { value: 'expired', label: 'Expired', icon: faTimesCircle },
    { value: 'paused', label: 'Paused', icon: faPause }
  ];

  const getUniqueCategories = (subs: any[]): string[] => {
    return [...new Set(subs
      .map(sub => sub.subscription_provider?.category)
      .filter(Boolean)
      .sort()
    )];
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // Simplified dependency array

  useEffect(() => {
    fetchDashboardData();
  }, [excludedStates, excludedCategories]);

  // Add this helper function at the top of the component
  const getComputedColor = (cssVar: string) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();
  };

  // Move centerTextPlugin inside component to access stats
  const centerTextPluginActive = {
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, width, height } = chart;
      ctx.restore();

      // Calculate font size based on chart height
      const fontSize = (height / 114).toFixed(2);
      ctx.font = `${fontSize}em sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--bs-body-color')
        .trim();

      const text = `${stats.activeSubscriptions}/${stats.totalSubscriptions}`;
      const textX = width / 2;
      const textY = height / 2 - (height * 0.05); // Adjust up by 5% of height

      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  };

  const centerTextPluginAutorenews = {
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, width, height } = chart;
      ctx.restore();
      const fontSize = (height / 114).toFixed(2);
      ctx.font = `${fontSize}em sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--bs-body-color')
        .trim();

      const text = `${stats.autoRenewalCount}/${stats.totalSubscriptions}`;
      const textX = width / 2;
      const textY = height / 2 - (height * 0.05); // Adjust up by 5% of height

      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  };

  // Add center text plugin for states chart
  const centerTextPluginStates = {
    id: 'centerTextStates',
    afterDraw: (chart) => {
        const { ctx, width, height } = chart;
        ctx.restore();

        // Calculate sum of only visible segments
        const meta = chart.getDatasetMeta(0);
        const total = meta.data.reduce((sum, dataPoint, index) => {
            return dataPoint.hidden ? sum : sum + chart.data.datasets[0].data[index];
        }, 0);

        const fontSize = (height / 114).toFixed(2);
        ctx.font = `${fontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bs-body-color')
            .trim();

        const textY = height / 2 - (height * 0.05);
        ctx.fillText(total.toString(), width / 2, textY);
        ctx.save();
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        setLoading(false);
        return;
      }

      // Get ALL subscriptions first, similar to MySubscriptions
      const { data: subscriptions, error } = await supabase
        .from('subscription')
        .select(`
          *,
          subscription_provider:subscription_provider_id(
            id,
            name,
            description,
            category,
            icon
          ),
          funding_source:funding_source_id(
            id,
            name,
            payment_provider:payment_provider_id(
              id,
              name,
              icon
            )
          ),
          subscription_history!inner(
            state,
            start_date,
            end_date
          )
        `)
        .eq('owner', user.id)
        .is('subscription_history.end_date', null);

      if (error) throw error;
      if (!subscriptions) return;

      // Filter subscriptions using the same logic as MySubscriptions
      const activeSubscriptions = subscriptions.filter(sub => 
        !excludedStates.includes(sub.subscription_history[0]?.state) &&
        !excludedCategories.includes(sub.subscription_provider?.category)
      );

      // Calculate stats using filtered data
      // const activeSubscriptions = filteredSubscriptions.filter(sub => 
      //   ['active', 'trial'].includes(sub.subscription_history[0]?.state)
      // );

      // Process data for charts
      const categories = {};
      const fundingSources = {};  // Changed from paymentProviders
      
      let yearlyTotal = 0;
      const now = new Date();
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      
      activeSubscriptions.forEach(sub => {
        // Calculate costs
        const amount = sub.amount || 0;
        const yearOccurrences = getOccurrencesCountInRange(sub.recurrence_rule, now, endOfYear);
        const yearCost = yearOccurrences * amount;
        yearlyTotal += yearCost;
        
        // Aggregate categories
        const category = sub.subscription_provider?.category || 'Unknown';
        categories[category] = (categories[category] || 0) + 1;
        
        // Aggregate funding sources instead of payment providers
        const fundingSourceName = sub.funding_source?.name || 'Unknown';
        fundingSources[fundingSourceName] = (fundingSources[fundingSourceName] || 0) + 1;
      });

      setStats({
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        totalMonthly: yearlyTotal / 12,
        totalYearly: yearlyTotal,
        totalDaily: yearlyTotal / 365,
        autoRenewalCount: activeSubscriptions.filter(s => s.autorenew).length,
        categoryData: {
          labels: Object.keys(categories),
          values: Object.values(categories)
        },
        paymentData: {  // Keep same name to avoid changing interface
          labels: Object.keys(fundingSources),
          values: Object.values(fundingSources)
        },
        stateDistribution: calculateStats(subscriptions).stateDistribution
      });

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setLoading(false);
    }
  };

  // Create theme-aware chart options
  const getChartOptions = (showLegend = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: showLegend,
            position: 'bottom' as const,
            labels: {
                color: getComputedStyle(document.documentElement)
                    .getPropertyValue('--bs-body-color')
                    .trim(),
                padding: 10,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        }
    }
  });

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        display: true,
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color').trim()
        }
      }
    }
  };

  // Add state colors mapping
  const stateColors = {
    trial: getComputedColor('--bs-info'),
    active: getComputedColor('--bs-success'),
    canceled: getComputedColor('--bs-danger'),
    expired: getComputedColor('--bs-secondary'),
    paused: getComputedColor('--bs-warning')
  };

  // Update stats calculation
  const calculateStats = (subscriptions: Subscription[]) => {
    const stateGroups = subscriptions.reduce((acc, sub) => {
      acc[sub.state] = (acc[sub.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...stats,
      stateDistribution: stateGroups
    };
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 text-body">
          <FontAwesomeIcon icon={faChartPie} className="me-2" />
          Dashboard Overview
        </h3>
        
        <Button
          variant={showFilters ? 'primary' : 'outline-primary'}
          onClick={() => setShowFilters(!showFilters)}
          className="d-flex align-items-center position-relative"
        >
          <FontAwesomeIcon icon={faFilter} />
          <span className="d-none d-sm-inline ms-2">Filters</span>
          {(excludedStates.length > 0 || excludedCategories.length > 0) && (
            <span
              className="position-absolute translate-middle badge rounded-pill bg-danger"
              style={{
                fontSize: '0.65em',
                top: -2,
                right: -2,
                padding: '0.35em 0.5em'
              }}
            >
              {excludedStates.length + excludedCategories.length}
              <span className="visually-hidden">active filters</span>
            </span>
          )}
        </Button>
      </div>

      <Collapse in={showFilters}>
        <div>
          <Card className="mb-4 shadow-sm" style={{
            backgroundColor: 'var(--bs-body-bg)',
            borderColor: 'var(--bs-border-color)'
          }}>
            <Card.Body>
              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Label>
                    Exclude States<br />
                    <small className="text-muted">Exclude subscription States from the dashboard.</small>
                  </Form.Label>
                  <Select
                    isMulti
                    value={stateFilterOptions.filter(option =>
                      excludedStates.includes(option.value)
                    )}
                    onChange={(selected) => {
                      setExcludedStates(selected ? selected.map(option => option.value) : []);
                    }}
                    options={stateFilterOptions}
                    placeholder="Select states to exclude..."
                    styles={selectStyles}
                  />
                </div>
                <div className="col-md-6">
                  <Form.Label>
                    Exclude Categories<br />
                    <small className="text-muted">Exclude Categories from the dashboard.</small>
                  </Form.Label>
                  <Select
                    isMulti
                    value={excludedCategories.map(cat => ({ value: cat, label: cat }))}
                    onChange={(selected) => {
                      setExcludedCategories(selected ? selected.map(option => option.value) : []);
                    }}
                    options={stats.categoryData.labels
                      .map(cat => ({ value: cat, label: cat }))}
                    placeholder="Select categories to exclude..."
                    styles={selectStyles}
                  />
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setExcludedStates([]);
                  setExcludedCategories([]);
                  setShowFilters(false);
                }}
                className="me-2"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                Reset All
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <FontAwesomeIcon icon={faCheck} className="me-2" />
                Apply Filters
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </Collapse>
      
      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <Row className="g-4 mb-4">
            <Col xs={6} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                  <div className="text-body-secondary d-none d-md-block">Active Subscriptions</div>
                  <div className="text-body-secondary d-block d-md-none">Active</div>
                    <div className="bg-success bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faRotate} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">{stats.activeSubscriptions} / {stats.totalSubscriptions}</h3>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                  <div className="text-body-secondary d-none d-md-block">Daily Cost</div>
                  <div className="text-body-secondary d-block d-md-none">Daily</div>
                    <div className="bg-danger bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faHandHoldingDollar} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">${stats.totalDaily.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={6} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-body-secondary d-none d-md-block">Monthly Cost</div>
                    <div className="text-body-secondary d-block d-md-none">Monthly</div>
                    <div className="bg-info bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">${stats.totalMonthly.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={6} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                  <div className="text-body-secondary d-none d-md-block">Yearly Cost</div>
                  <div className="text-body-secondary d-block d-md-none">Yearly</div>
                    <div className="bg-warning bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">${stats.totalYearly.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row className="g-4">
            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0 text-body">
                    <FontAwesomeIcon icon={faChartPie} className="me-2" />
                    Categories
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Pie
                      data={{
                        labels: stats.categoryData.labels,
                        datasets: [{
                          data: stats.categoryData.values,
                          backgroundColor: [
                            '#4a5568',  // muted gray
                            '#2c5282',  // muted blue
                            '#276749',  // muted green
                            '#9b2c2c',  // muted red
                            '#c05621',  // muted orange
                            '#2b6cb0'   // muted steel blue
                          ]
                        }]
                      }}
                      options={pieOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                    Funding Sources
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Pie
                      data={{
                        labels: stats.paymentData.labels,
                        datasets: [{
                          data: stats.paymentData.values,
                          backgroundColor: [
                            '#718096',  // lighter muted gray
                            '#3182ce',  // lighter muted blue
                            '#38a169',  // lighter muted green
                            '#e53e3e',  // lighter muted red
                            '#dd6b20',  // lighter muted orange
                            '#4299e1'   // lighter muted steel blue
                          ]
                        }]
                      }}
                      options={pieOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0 text-body">
                    <FontAwesomeIcon icon={faRotate} className="me-2" />
                    Subscription States
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Doughnut
                      data={{
                        labels: Object.keys(stateColors).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                        datasets: [{
                          data: Object.keys(stateColors).map(state => stats.stateDistribution[state] || 0),
                          backgroundColor: Object.values(stateColors),
                          borderColor: Object.values(stateColors),
                          borderWidth: 1,
                          cutout: '70%'
                        }]
                      }}
                      options={getChartOptions()}  // Use same options as other charts
                      plugins={[centerTextPluginStates]}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0 text-body">
                    <FontAwesomeIcon icon={faRotate} className="me-2" />
                    Auto-Renews
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Doughnut
                      data={{
                        labels: ['Auto-Renew', 'Manual Renewal'],
                        datasets: [{
                          data: [
                            stats.autoRenewalCount,
                            stats.totalSubscriptions - stats.autoRenewalCount
                          ],
                          backgroundColor: [
                            '#3182ce',  // brighter muted blue
                            getComputedColor('--bs-gray-500')
                          ],
                          borderColor: [
                            '#3182ce',
                            getComputedColor('--bs-gray-500')
                          ],
                          borderWidth: 1,
                          cutout: '70%'
                        }]
                      }}
                      options={getChartOptions()}
                      plugins={[centerTextPluginAutorenews]}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;